import {
  ConflictError,
  NotFoundError,
  ValidationException,
  type Correction,
  type FeedbackRating,
} from '@app/api-server-sdk';
import { and, asc, desc, eq, inArray, lt } from 'drizzle-orm';

import { type Db, schema } from '../db/client.js';
import { createNoopTracer, type Tracer } from '../observability/tracer.js';
import { type Embedder } from '../rag/embeddings.js';

export interface SubmitFeedbackInput {
  messageId: string;
  rating: FeedbackRating;
  whatWasWrong?: string;
  correctedAnswer?: string;
  userId: string;
}

export interface FeedbackService {
  submit(input: SubmitFeedbackInput): Promise<Correction>;
  listCorrections(companyId: string, includeInactive: boolean): Promise<Correction[]>;
  updateCorrection(correctionId: string, active: boolean): Promise<Correction>;
}

export function createFeedbackService(
  db: Db,
  embedder: Embedder,
  tracer: Tracer = createNoopTracer(),
): FeedbackService {
  async function toCorrections(rows: schema.Feedback[]): Promise<Correction[]> {
    if (!rows.length) return [];
    const users = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, [...new Set(rows.map((r) => r.userId))]));
    const userBy = new Map(users.map((u) => [u.id, u]));
    return rows.map((f) => {
      const u = userBy.get(f.userId)!;
      return {
        id: f.id,
        companyId: f.companyId,
        conversationId: f.conversationId,
        messageId: f.messageId,
        rating: f.rating,
        queryText: f.queryText,
        whatWasWrong: f.whatWasWrong ?? undefined,
        correctedAnswer: f.correctedAnswer ?? undefined,
        guidelineVersionId: f.guidelineVersionId,
        active: f.active,
        user: { id: u.id, username: u.username, displayName: u.displayName },
        createdAt: f.createdAt,
      };
    });
  }

  async function one(id: string) {
    const row = await db.query.feedback.findFirst({ where: eq(schema.feedback.id, id) });
    if (!row)
      throw new NotFoundError({ message: 'Correction not found', resource: 'correction', id });
    return (await toCorrections([row]))[0]!;
  }

  return {
    async submit(input) {
      const message = await db.query.messages.findFirst({
        where: eq(schema.messages.id, input.messageId),
      });
      if (!message)
        throw new NotFoundError({
          message: 'Message not found',
          resource: 'message',
          id: input.messageId,
        });
      if (message.role !== 'assistant' || message.status !== 'ok') {
        throw new ConflictError({ message: 'Only successful assistant answers can be rated' });
      }
      const whatWasWrong = input.whatWasWrong?.trim() || null;
      const correctedAnswer = input.correctedAnswer?.trim() || null;
      if (input.rating === 'down' && !correctedAnswer) {
        throw new ValidationException({
          message: 'A corrected answer is required when rating an answer down',
          fieldList: [
            {
              path: '/correctedAnswer',
              message: 'Provide the answer the assistant should have given',
            },
          ],
        });
      }

      const conversation = await db.query.conversations.findFirst({
        where: eq(schema.conversations.id, message.conversationId),
      });
      // Conversations are private: an answer in another agent's thread cannot be rated.
      if (conversation?.createdBy !== input.userId)
        throw new NotFoundError({
          message: 'Conversation not found',
          resource: 'conversation',
          id: message.conversationId,
        });

      // The customer message this answer responded to: last customer turn before the assistant message.
      const [customer] = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.conversationId, message.conversationId),
            eq(schema.messages.role, 'customer'),
            lt(schema.messages.createdAt, message.createdAt),
          ),
        )
        .orderBy(desc(schema.messages.createdAt))
        .limit(1);
      const queryText = customer?.content ?? message.content;

      let guidelineVersionId = message.guidelineVersionId;
      if (!guidelineVersionId) {
        const company = await db.query.companies.findFirst({
          where: eq(schema.companies.id, conversation.companyId),
        });
        guidelineVersionId = company?.activeGuidelineVersionId ?? null;
      }
      if (!guidelineVersionId)
        throw new ConflictError({
          message: 'Cannot store feedback: no guideline version is associated',
        });

      const queryEmbedding = await embedder.embedQuery(queryText);
      const values = {
        messageId: message.id,
        conversationId: message.conversationId,
        companyId: conversation.companyId,
        userId: input.userId,
        rating: input.rating,
        whatWasWrong,
        correctedAnswer,
        queryText,
        queryEmbedding,
        guidelineVersionId,
        active: true,
      };
      const [row] = await db
        .insert(schema.feedback)
        .values(values)
        .onConflictDoUpdate({
          target: [schema.feedback.messageId, schema.feedback.userId],
          set: {
            rating: values.rating,
            whatWasWrong,
            correctedAnswer,
            queryText,
            queryEmbedding,
            guidelineVersionId,
            active: true,
          },
        })
        .returning();
      // Attach the agent's verdict to the trace of the turn that produced the answer.
      if (message.traceId) {
        tracer.score({
          traceId: message.traceId,
          name: 'agent-rating',
          value: input.rating === 'up' ? 1 : 0,
          dataType: 'BOOLEAN',
          comment: whatWasWrong ?? undefined,
          metadata: { messageId: message.id, feedbackId: row!.id },
        });
        if (correctedAnswer) {
          tracer.score({
            traceId: message.traceId,
            name: 'agent-correction',
            value:
              correctedAnswer.length > 500 ? `${correctedAnswer.slice(0, 499)}…` : correctedAnswer,
            dataType: 'TEXT',
            metadata: { messageId: message.id, feedbackId: row!.id },
          });
        }
      }
      return (await toCorrections([row!]))[0]!;
    },

    async listCorrections(companyId, includeInactive) {
      const company = await db.query.companies.findFirst({
        where: eq(schema.companies.id, companyId),
      });
      if (!company)
        throw new NotFoundError({
          message: 'Company not found',
          resource: 'company',
          id: companyId,
        });
      const rows = await db
        .select()
        .from(schema.feedback)
        .where(
          includeInactive
            ? eq(schema.feedback.companyId, companyId)
            : and(eq(schema.feedback.companyId, companyId), eq(schema.feedback.active, true)),
        )
        .orderBy(desc(schema.feedback.createdAt), asc(schema.feedback.id));
      return toCorrections(rows);
    },

    async updateCorrection(correctionId, active) {
      await one(correctionId);
      await db.update(schema.feedback).set({ active }).where(eq(schema.feedback.id, correctionId));
      return one(correctionId);
    },
  };
}
