import {
  GuidelinesNotReadyError,
  NotFoundError,
  type Conversation,
  type ConversationSummary,
  type Coverage,
  type Message,
  type MessageKind,
} from '@app/api-server-sdk';
import { and, asc, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { type Config } from '../config.js';
import { type Db, schema } from '../db/client.js';
import { providerErrorMessage } from '../lib/unknown.js';
import { type AppLogger } from '../logger.js';
import { type Tracer } from '../observability/tracer.js';
import { type Embedder } from '../rag/embeddings.js';
import { finalizeGuidance, GuidanceParseError } from '../rag/guidance.js';
import { ChatModelError, type ChatModel } from '../rag/llm.js';
import {
  estimatePromptTokens,
  fitHistoryToBudget,
  SUMMARY_SYSTEM_PROMPT,
  transcriptForSummary,
  retrievalQuery,
  type HistoryTurn,
} from '../rag/prompt.js';
import {
  mergeRetrieved,
  retrieveChunksByVector,
  retrieveCorrections,
  retrieveKeywordRescue,
} from '../rag/retrieval.js';

/** Extra guideline sections admitted through a matching correction's original question. */
const CORRECTION_ANCHORED_SECTIONS = 2;

/** Conversations are private to the agent who started them: every read is scoped by `userId`. */
export interface ListArgs {
  userId: string;
  companyId?: string;
  coverage?: Coverage;
  cursor?: string;
  limit?: number;
}

/** Message paging: the newest `limit` messages, or the `limit` messages before a cursor. */
export interface MessagePage {
  before?: string;
  limit?: number;
}

export interface ConversationsService {
  create(companyId: string, userId: string): Promise<Conversation>;
  list(args: ListArgs): Promise<{ items: ConversationSummary[]; nextCursor?: string }>;
  /** 404 for a conversation that exists but belongs to another agent (existence is not leaked). */
  get(
    conversationId: string,
    userId: string,
    page?: MessagePage,
  ): Promise<{ conversation: Conversation; olderCursor?: string }>;
  sendMessage(args: {
    conversationId: string;
    kind: MessageKind;
    content: string;
    userId: string;
  }): Promise<{ userMessage: Message; assistantMessage: Message }>;
}

export interface ConversationDeps {
  db: Db;
  embedder: Embedder;
  chatModel: ChatModel;
  config: Pick<
    Config,
    | 'RAG_TOP_K'
    | 'RAG_MIN_SCORE'
    | 'RAG_CORRECTIONS_TOP_K'
    | 'RAG_CORRECTIONS_MIN_SCORE'
    | 'CHAT_HISTORY_WINDOW'
    | 'CHAT_PROMPT_TOKEN_BUDGET'
    | 'GEMINI_CONTEXT_WINDOW_TOKENS'
  >;
  log: AppLogger;
  tracer: Tracer;
}

type UserRow = schema.User;
const toUser = (u: UserRow) => ({ id: u.id, username: u.username, displayName: u.displayName });

/** Keyset cursor "timestamp|id", shared by the conversation list and message paging. */
const encodeCursor = (at: Date, id: string) =>
  Buffer.from(`${at.toISOString()}|${id}`).toString('base64url');
const decodeCursor = (cursor: string): { at: Date; id: string } | null => {
  try {
    const [ts, id] = Buffer.from(cursor, 'base64url').toString().split('|');
    if (!ts || !id) return null;
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : { at: d, id };
  } catch {
    return null;
  }
};

export function createConversationsService({
  db,
  embedder,
  chatModel,
  config,
  log,
  tracer,
}: ConversationDeps): ConversationsService {
  async function loadUsers(ids: string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map<string, UserRow>();
    const rows = await db.select().from(schema.users).where(inArray(schema.users.id, unique));
    return new Map(rows.map((u) => [u.id, u]));
  }

  async function summaries(
    rows: (schema.Conversation & { companyName: string })[],
  ): Promise<ConversationSummary[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [counts, users] = await Promise.all([
      db
        .select({ conversationId: schema.messages.conversationId, n: sql<number>`count(*)::int` })
        .from(schema.messages)
        .where(inArray(schema.messages.conversationId, ids))
        .groupBy(schema.messages.conversationId),
      loadUsers(rows.map((r) => r.createdBy)),
    ]);
    const countBy = new Map(counts.map((c) => [c.conversationId, c.n]));
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      companyName: r.companyName,
      title: r.title,
      messageCount: countBy.get(r.id) ?? 0,
      lastCoverage: r.lastCoverage ?? undefined,
      createdBy: toUser(users.get(r.createdBy)!),
      createdAt: r.createdAt,
      lastMessageAt: r.lastMessageAt,
    }));
  }

  /** Loads a conversation the given agent owns; another agent's conversation is a 404. */
  async function loadConversation(conversationId: string, userId: string) {
    const [row] = await db
      .select({
        conversation: schema.conversations,
        companyName: schema.companies.name,
        company: schema.companies,
      })
      .from(schema.conversations)
      .innerJoin(schema.companies, eq(schema.companies.id, schema.conversations.companyId))
      .where(eq(schema.conversations.id, conversationId));
    if (row?.conversation.createdBy !== userId)
      throw new NotFoundError({
        message: 'Conversation not found',
        resource: 'conversation',
        id: conversationId,
      });
    return row;
  }

  async function mapMessages(rows: schema.Message[]): Promise<Message[]> {
    if (!rows.length) return [];
    const ids = rows.map((m) => m.id);
    const [feedbackRows, users] = await Promise.all([
      db.select().from(schema.feedback).where(inArray(schema.feedback.messageId, ids)),
      loadUsers(rows.map((m) => m.createdBy)),
    ]);
    const feedbackUsers = await loadUsers(feedbackRows.map((f) => f.userId));
    const feedbackBy = new Map<string, Message['feedback']>();
    for (const f of feedbackRows) {
      const list = feedbackBy.get(f.messageId) ?? [];
      list.push({
        id: f.id,
        rating: f.rating,
        whatWasWrong: f.whatWasWrong ?? undefined,
        correctedAnswer: f.correctedAnswer ?? undefined,
        user: toUser(feedbackUsers.get(f.userId)!),
        createdAt: f.createdAt,
      });
      feedbackBy.set(f.messageId, list);
    }
    return rows.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      status: m.status,
      error: m.error ?? undefined,
      guidance: m.guidance ?? undefined,
      retrieval: m.retrieval?.map((r) => ({
        chunkId: r.chunkId,
        title: r.title ?? undefined,
        score: r.score,
      })),
      correctionsUsed: m.correctionsUsed ?? undefined,
      guidelineVersionId: m.guidelineVersionId ?? undefined,
      model: m.model ?? undefined,
      promptTokens: m.promptTokens ?? undefined,
      completionTokens: m.completionTokens ?? undefined,
      thinkingTokens: m.thinkingTokens ?? undefined,
      totalTokens: m.totalTokens ?? undefined,
      latencyMs: m.latencyMs ?? undefined,
      feedback: feedbackBy.get(m.id),
      createdBy: toUser(users.get(m.createdBy)!),
      createdAt: m.createdAt,
    }));
  }

  /**
   * The conversation with one page of messages: the newest `limit` (default 50), or the `limit`
   * before `page.before`. Messages are returned in chronological order; `olderCursor` points at
   * the page's first message when older ones exist, so a thread of any length loads page by page.
   */
  async function full(
    conversationId: string,
    userId: string,
    page: MessagePage = {},
  ): Promise<{ conversation: Conversation; olderCursor?: string }> {
    const row = await loadConversation(conversationId, userId);
    const [summary] = await summaries([{ ...row.conversation, companyName: row.companyName }]);
    const limit = Math.min(Math.max(page.limit ?? 50, 1), 100);
    const before = page.before ? decodeCursor(page.before) : null;
    const filters = [eq(schema.messages.conversationId, conversationId)];
    if (before) {
      filters.push(
        or(
          lt(schema.messages.createdAt, before.at),
          and(eq(schema.messages.createdAt, before.at), lt(schema.messages.id, before.id)),
        )!,
      );
    }
    const rows = await db
      .select()
      .from(schema.messages)
      .where(and(...filters))
      .orderBy(desc(schema.messages.createdAt), desc(schema.messages.id))
      .limit(limit + 1);
    const pageRows = rows.slice(0, limit).reverse();
    const oldest = pageRows[0];
    return {
      conversation: { summary: summary!, messages: await mapMessages(pageRows) },
      olderCursor:
        rows.length > limit && oldest ? encodeCursor(oldest.createdAt, oldest.id) : undefined,
    };
  }

  return {
    async create(companyId, userId) {
      const company = await db.query.companies.findFirst({
        where: eq(schema.companies.id, companyId),
      });
      if (!company)
        throw new NotFoundError({
          message: 'Company not found',
          resource: 'company',
          id: companyId,
        });
      if (!company.activeGuidelineVersionId) {
        throw new GuidelinesNotReadyError({
          message:
            'This company has no processed guidelines yet. Upload guidelines before starting a chat.',
          companyId,
        });
      }
      const [row] = await db
        .insert(schema.conversations)
        .values({ companyId, createdBy: userId })
        .returning();
      return (await full(row!.id, userId)).conversation;
    },

    async list(args) {
      const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
      const filters = [eq(schema.conversations.createdBy, args.userId)];
      if (args.companyId) filters.push(eq(schema.conversations.companyId, args.companyId));
      if (args.coverage) filters.push(eq(schema.conversations.lastCoverage, args.coverage));
      const c = args.cursor ? decodeCursor(args.cursor) : null;
      if (c) {
        filters.push(
          or(
            lt(schema.conversations.lastMessageAt, c.at),
            and(eq(schema.conversations.lastMessageAt, c.at), lt(schema.conversations.id, c.id)),
          )!,
        );
      }
      const rows = await db
        .select({ conversation: schema.conversations, companyName: schema.companies.name })
        .from(schema.conversations)
        .innerJoin(schema.companies, eq(schema.companies.id, schema.conversations.companyId))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(schema.conversations.lastMessageAt), desc(schema.conversations.id))
        .limit(limit + 1);
      const page = rows.slice(0, limit);
      const items = await summaries(
        page.map((r) => ({ ...r.conversation, companyName: r.companyName })),
      );
      const last = page[page.length - 1];
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? encodeCursor(last.conversation.lastMessageAt, last.conversation.id)
            : undefined,
      };
    },

    get: (conversationId, userId, page) => full(conversationId, userId, page),

    async sendMessage({ conversationId, kind, content, userId }) {
      const { conversation, company, companyName } = await loadConversation(conversationId, userId);
      if (!company.activeGuidelineVersionId) {
        throw new GuidelinesNotReadyError({
          message: 'The company has no active guidelines',
          companyId: company.id,
        });
      }
      const versionId = company.activeGuidelineVersionId;
      const text = content.trim();

      const history = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(asc(schema.messages.createdAt), asc(schema.messages.id));

      // Idempotent retry: re-sending the same text right after a failed assistant turn reuses the user message.
      const lastMsg = history[history.length - 1];
      const prevUser = history[history.length - 2];
      let userMessage: schema.Message;
      let priorHistory: schema.Message[];
      if (
        lastMsg?.role === 'assistant' &&
        lastMsg.status === 'failed' &&
        prevUser &&
        prevUser.role !== 'assistant' &&
        prevUser.content === text &&
        prevUser.role === kind
      ) {
        await db.delete(schema.messages).where(eq(schema.messages.id, lastMsg.id));
        userMessage = prevUser;
        priorHistory = history.slice(0, -2);
      } else {
        const [inserted] = await db
          .insert(schema.messages)
          .values({ conversationId, role: kind, content: text, status: 'ok', createdBy: userId })
          .returning();
        userMessage = inserted!;
        priorHistory = history;
        if (!conversation.title && kind === 'customer') {
          await db
            .update(schema.conversations)
            .set({ title: text.length > 80 ? `${text.slice(0, 77)}…` : text })
            .where(eq(schema.conversations.id, conversationId));
        }
      }

      // Messages already folded into the rolling summary are not replayed verbatim.
      const summarisedUpto = conversation.historySummaryUpto
        ? priorHistory.findIndex((m) => m.id === conversation.historySummaryUpto) + 1
        : 0;
      const unsummarised = priorHistory.slice(summarisedUpto);
      const window = unsummarised.slice(-config.CHAT_HISTORY_WINDOW);
      const overflow = unsummarised.slice(0, unsummarised.length - window.length);
      const toTurn = (m: schema.Message): HistoryTurn => ({
        role: m.role,
        // Older assistant turns are compacted to what matters for continuity, not the full JSON.
        content: m.role === 'assistant' ? compactGuidance(m) : m.content,
      });
      const historyTurns = window.map(toTurn);
      const latest = { kind: kind, content: text };
      const query = retrievalQuery(historyTurns, latest);

      const assistant = await tracer.runTurn(
        {
          conversationId,
          userId,
          companyId: company.id,
          companyName,
          guidelineVersionId: versionId,
          kind: latest.kind,
          content: text,
        },
        async (turn) => {
          const started = Date.now();
          // Rolling summary: fold turns that fell out of the window into one short paragraph so very
          // long chats keep their context without growing the prompt (see docs/hld.md, prompt budget and rolling summary).
          let summary = conversation.historySummary ?? undefined;
          if (overflow.length > 0) {
            const summaryStarted = Date.now();
            const input = transcriptForSummary(summary, overflow.map(toTurn));
            try {
              const output = await chatModel.summarize({
                system: SUMMARY_SYSTEM_PROMPT,
                text: input,
              });
              if (output) {
                summary = output;
                await db
                  .update(schema.conversations)
                  .set({ historySummary: output, historySummaryUpto: overflow.at(-1)!.id })
                  .where(eq(schema.conversations.id, conversationId));
              }
              turn.summary({
                model: chatModel.model,
                messages: overflow.length,
                input,
                output,
                latencyMs: Date.now() - summaryStarted,
              });
              log.info(
                {
                  conversationId,
                  messages: overflow.length,
                  latencyMs: Date.now() - summaryStarted,
                },
                'history summarised',
              );
            } catch (err) {
              // Not fatal: answer with the window only; the overflow is retried on the next turn.
              const message = err instanceof ChatModelError ? err.message : 'summary failed';
              turn.summary({
                model: chatModel.model,
                messages: overflow.length,
                input,
                error: message,
                latencyMs: Date.now() - summaryStarted,
              });
              log.warn({ err, conversationId }, 'history summary failed; continuing without it');
            }
          }
          // Retrieval and prompt assembly. A provider failure here (embedding the message) is
          // stored as a failed turn exactly like a generation failure, so the agent's message is
          // never left without an assistant row and a retry reuses it (see the retry check above).
          const retrievalStarted = Date.now();
          let retrieved: ReturnType<typeof fitHistoryToBudget> & {
            sections: Awaited<ReturnType<typeof retrieveChunksByVector>>;
            corrections: Awaited<ReturnType<typeof retrieveCorrections>>;
          };
          try {
            const queryVector = await embedder.embedQuery(query);
            const [directSections, corrections] = await Promise.all([
              retrieveChunksByVector(db, {
                versionId,
                vector: queryVector,
                topK: config.RAG_TOP_K,
                minScore: config.RAG_MIN_SCORE,
              }),
              retrieveCorrections(db, embedder, {
                companyId: company.id,
                query,
                topK: config.RAG_CORRECTIONS_TOP_K,
                minScore: config.RAG_CORRECTIONS_MIN_SCORE,
              }),
            ]);
            // Correction-anchored retrieval (see mergeRetrieved): reuse the best correction's stored
            // question embedding, no extra provider call.
            const anchor = corrections[0]?.queryEmbedding;
            const anchored = anchor
              ? mergeRetrieved(
                  directSections,
                  await retrieveChunksByVector(db, {
                    versionId,
                    vector: anchor,
                    topK: config.RAG_TOP_K,
                    minScore: config.RAG_MIN_SCORE,
                  }),
                  CORRECTION_ANCHORED_SECTIONS,
                )
              : directSections;
            // Keyword rescue (see retrieveKeywordRescue): a section the vector ranking missed but
            // that a distinctive word of the message points at is appended, never reordered.
            const rescued = await retrieveKeywordRescue(db, {
              versionId,
              query,
              vector: queryVector,
              exclude: anchored.map((s) => s.chunkId),
            });
            const sections = rescued ? [...anchored, rescued] : anchored;
            turn.retrieval(query, { sections, corrections });
            retrieved = {
              sections,
              corrections,
              ...fitHistoryToBudget(
                { companyName, summary, sections, corrections, history: historyTurns, latest },
                config.CHAT_PROMPT_TOKEN_BUDGET,
              ),
            };
          } catch (err) {
            const latencyMs = Date.now() - retrievalStarted;
            const message =
              providerErrorMessage(err) ?? 'The assistant could not look up the guidelines';
            log.error({ err, conversationId }, 'retrieval failed');
            const [row] = await db
              .insert(schema.messages)
              .values({
                conversationId,
                role: 'assistant',
                createdBy: userId,
                guidelineVersionId: versionId,
                model: chatModel.model,
                traceId: turn.traceId,
                retrieval: [],
                correctionsUsed: [],
                content: '',
                status: 'failed',
                error: message,
                latencyMs,
              })
              .returning();
            turn.end({ status: 'failed', messageId: row!.id });
            return row!;
          }
          const { sections, corrections, prompt, dropped } = retrieved;
          const estimatedPromptTokens = estimatePromptTokens(prompt);

          const base = {
            conversationId,
            role: 'assistant' as const,
            createdBy: userId,
            guidelineVersionId: versionId,
            model: chatModel.model,
            traceId: turn.traceId,
            retrieval: sections.map((s) => ({
              chunkId: s.chunkId,
              title: s.title,
              score: s.score,
              ...(s.via ? { via: s.via } : {}),
            })),
            correctionsUsed: corrections.map((c) => ({
              correctionId: c.correctionId,
              score: c.score,
            })),
          };

          const record = (
            g: Omit<
              Parameters<typeof turn.generation>[0],
              | 'model'
              | 'system'
              | 'turns'
              | 'estimatedPromptTokens'
              | 'contextWindowTokens'
              | 'contextUsedPct'
              | 'droppedHistoryTurns'
            >,
          ) => {
            const used = g.promptTokens ?? estimatedPromptTokens;
            const contextUsedPct =
              Math.round((used / config.GEMINI_CONTEXT_WINDOW_TOKENS) * 10000) / 100;
            const full = {
              ...g,
              model: chatModel.model,
              system: prompt.system,
              turns: prompt.turns,
              estimatedPromptTokens,
              contextWindowTokens: config.GEMINI_CONTEXT_WINDOW_TOKENS,
              contextUsedPct,
              droppedHistoryTurns: dropped,
            };
            turn.generation(full);
            log.info(
              {
                conversationId,
                model: chatModel.model,
                promptTokens: g.promptTokens,
                completionTokens: g.completionTokens,
                thinkingTokens: g.thinkingTokens,
                totalTokens: g.totalTokens,
                finishReason: g.finishReason,
                estimatedPromptTokens,
                contextWindowTokens: config.GEMINI_CONTEXT_WINDOW_TOKENS,
                contextUsedPct,
                droppedHistoryTurns: dropped,
                latencyMs: g.latencyMs,
                sections: sections.length,
                corrections: corrections.length,
                ...(g.error ? { error: g.error } : {}),
              },
              g.error ? 'llm call failed' : 'llm call',
            );
          };

          try {
            const result = await chatModel.generateGuidance({
              system: prompt.system,
              turns: prompt.turns,
            });
            const latencyMs = Date.now() - started;
            record({
              raw: result.raw,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              thinkingTokens: result.thinkingTokens,
              totalTokens: result.totalTokens,
              finishReason: result.finishReason,
              latencyMs,
            });
            const guidance = finalizeGuidance(result.raw, prompt.sectionIds);
            const [row] = await db
              .insert(schema.messages)
              .values({
                ...base,
                content: guidance.recommendedReply ?? '',
                status: 'ok',
                guidance: guidance,
                coverage: guidance.coverage ?? 'partial',
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                thinkingTokens: result.thinkingTokens,
                totalTokens: result.totalTokens,
                latencyMs,
              })
              .returning();
            turn.end({ status: 'ok', coverage: guidance.coverage, messageId: row!.id });
            return row!;
          } catch (err) {
            const latencyMs = Date.now() - started;
            const known = err instanceof ChatModelError || err instanceof GuidanceParseError;
            const message = known ? err.message : 'The assistant could not produce a response';
            if (!known)
              log.error({ err, conversationId }, 'unexpected error while generating guidance');
            record({ error: message, latencyMs });
            const [row] = await db
              .insert(schema.messages)
              .values({ ...base, content: '', status: 'failed', error: message, latencyMs })
              .returning();
            turn.end({ status: 'failed', messageId: row!.id });
            return row!;
          }
        },
      );

      // A failed turn has no coverage; the previous verdict stays until the retry succeeds.
      await db
        .update(schema.conversations)
        .set({
          lastMessageAt: assistant.createdAt,
          ...(assistant.coverage ? { lastCoverage: assistant.coverage } : {}),
        })
        .where(eq(schema.conversations.id, conversationId));

      const [u, a] = await mapMessages([userMessage, assistant]);
      return { userMessage: u!, assistantMessage: a! };
    },
  };
}

/** What an earlier assistant turn contributes to the next prompt: verdict + reply, not the whole JSON. */
function compactGuidance(m: schema.Message): string {
  const g = m.guidance;
  if (!g) return m.status === 'failed' ? '(previous answer failed)' : m.content;
  const parts = [
    `coverage: ${g.coverage ?? 'unknown'}`,
    `recommendedReply: ${g.recommendedReply ?? m.content}`,
  ];
  if (g.clarifications?.length) parts.push(`clarifications: ${g.clarifications.join(' | ')}`);
  return parts.join('\n');
}
