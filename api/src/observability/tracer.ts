/**
 * LLM observability. One trace per chat turn:
 *   chat-turn (session = conversation, user = agent)
 *   ├── history-summary    (only when older turns were folded into the rolling summary)
 *   ├── retrieval          query → sections with scores, corrections
 *   └── gemini.generate    full prompt, raw output, token usage, latency, % of context window
 * One trace per guideline ingestion (parse → chunk → embedding batches), and agent feedback is
 * attached to the chat-turn trace as Langfuse scores.
 *
 * Langfuse is optional (enabled by LANGFUSE_* keys); the interface keeps the services free of any
 * vendor types and lets tests record calls in memory.
 */
import { LangfuseClient } from '@langfuse/client';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { propagateAttributes, startObservation } from '@langfuse/tracing';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

import { type AppLogger } from '../logger.js';
import { type ChatTurn } from '../rag/prompt.js';
import { type RetrievedChunk, type RetrievedCorrection } from '../rag/retrieval.js';

export interface TurnMeta {
  conversationId: string;
  userId: string;
  companyId: string;
  companyName: string;
  guidelineVersionId: string;
  kind: 'customer' | 'instruction';
  content: string;
}

export interface GenerationRecord {
  model: string;
  system: string;
  turns: ChatTurn[];
  raw?: string;
  error?: string;
  promptTokens?: number;
  completionTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  estimatedPromptTokens: number;
  contextWindowTokens: number;
  /** promptTokens (or the estimate when the provider reported none) / contextWindowTokens * 100 */
  contextUsedPct: number;
  droppedHistoryTurns: number;
  latencyMs: number;
}

export interface SummaryRecord {
  model: string;
  /** Number of history messages folded into the summary in this turn. */
  messages: number;
  input: string;
  output?: string;
  error?: string;
  latencyMs: number;
}

export interface IngestionMeta {
  versionId: string;
  companyId: string;
  filename: string;
  userId: string;
}

export interface IngestionRecorder {
  /** Coarse pipeline step (parse, chunk) with a small result summary. */
  step(name: 'parse' | 'chunk', data: Record<string, number | string>): void;
  embedded(batch: { count: number; model: string; dimensions: number; latencyMs: number }): void;
  end(out: { status: 'ready' | 'failed' | 'superseded' | 'skipped'; error?: string }): void;
}

export interface ScoreInput {
  traceId: string;
  name: string;
  value: number | string;
  dataType: 'BOOLEAN' | 'NUMERIC' | 'TEXT';
  comment?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TurnRecorder {
  /** Trace id to store with the answer so later feedback can be attached as a score. */
  readonly traceId: string | undefined;
  summary(s: SummaryRecord): void;
  retrieval(
    query: string,
    out: { sections: RetrievedChunk[]; corrections: RetrievedCorrection[] },
  ): void;
  generation(g: GenerationRecord): void;
  end(out: { status: 'ok' | 'failed'; coverage?: string; messageId?: string }): void;
}

export interface Tracer {
  runTurn<T>(meta: TurnMeta, fn: (turn: TurnRecorder) => Promise<T>): Promise<T>;
  runIngestion<T>(meta: IngestionMeta, fn: (rec: IngestionRecorder) => Promise<T>): Promise<T>;
  /** Attaches a score (agent thumbs, corrections) to an earlier trace. Fire-and-forget. */
  score(input: ScoreInput): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

const noopRecorder: TurnRecorder = {
  traceId: undefined,
  summary: () => undefined,
  retrieval: () => undefined,
  generation: () => undefined,
  end: () => undefined,
};

const noopIngestion: IngestionRecorder = {
  step: () => undefined,
  embedded: () => undefined,
  end: () => undefined,
};

export function createNoopTracer(): Tracer {
  return {
    runTurn: (_meta, fn) => fn(noopRecorder),
    runIngestion: (_meta, fn) => fn(noopIngestion),
    score: () => undefined,
    flush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
}

/** Langfuse when the keys are configured, otherwise a no-op. */
export function createTracerFromConfig(
  config: {
    LANGFUSE_PUBLIC_KEY?: string;
    LANGFUSE_SECRET_KEY?: string;
    LANGFUSE_BASE_URL: string;
  },
  log: AppLogger,
): Tracer {
  if (config.LANGFUSE_PUBLIC_KEY && config.LANGFUSE_SECRET_KEY) {
    return createLangfuseTracer({
      publicKey: config.LANGFUSE_PUBLIC_KEY,
      secretKey: config.LANGFUSE_SECRET_KEY,
      baseUrl: config.LANGFUSE_BASE_URL,
      log,
    });
  }
  log.info({}, 'Langfuse tracing disabled (LANGFUSE_* not set)');
  return createNoopTracer();
}

export function createLangfuseTracer(opts: {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
  log: AppLogger;
}): Tracer {
  const processor = new LangfuseSpanProcessor({
    publicKey: opts.publicKey,
    secretKey: opts.secretKey,
    baseUrl: opts.baseUrl,
    exportMode: 'batched',
  });
  const provider = new NodeTracerProvider({ spanProcessors: [processor] });
  provider.register();
  const client = new LangfuseClient({
    publicKey: opts.publicKey,
    secretKey: opts.secretKey,
    baseUrl: opts.baseUrl,
  });
  opts.log.info({ baseUrl: opts.baseUrl }, 'Langfuse tracing enabled');

  return {
    async runTurn(meta, fn) {
      let result!: Awaited<ReturnType<typeof fn>>;
      await propagateAttributes(
        {
          userId: meta.userId,
          sessionId: meta.conversationId,
          metadata: {
            companyId: meta.companyId,
            companyName: meta.companyName,
            guidelineVersionId: meta.guidelineVersionId,
          },
          tags: [meta.kind],
        },
        async () => {
          const root = startObservation('chat-turn', {
            input: { kind: meta.kind, content: meta.content },
            metadata: {
              companyName: meta.companyName,
              guidelineVersionId: meta.guidelineVersionId,
            },
          });
          const recorder: TurnRecorder = {
            traceId: root.traceId,
            summary(s) {
              root
                .startObservation(
                  'history-summary',
                  {
                    model: s.model,
                    input: s.input,
                    output: s.output,
                    metadata: { messages: s.messages, latencyMs: s.latencyMs },
                    level: s.error ? 'ERROR' : undefined,
                    statusMessage: s.error,
                  },
                  { asType: 'generation' },
                )
                .end();
            },
            retrieval(query, out) {
              root
                .startObservation(
                  'retrieval',
                  {
                    input: { query },
                    output: {
                      sections: out.sections.map((s) => ({
                        chunkId: s.chunkId,
                        title: s.title,
                        score: s.score,
                        via: s.via,
                      })),
                      corrections: out.corrections.map((c) => ({
                        correctionId: c.correctionId,
                        rating: c.rating,
                        score: c.score,
                      })),
                    },
                    metadata: {
                      sectionCount: out.sections.length,
                      correctionCount: out.corrections.length,
                    },
                  },
                  { asType: 'retriever' },
                )
                .end();
            },
            generation(g) {
              root
                .startObservation(
                  'gemini.generateContent',
                  {
                    model: g.model,
                    input: [
                      { role: 'system', content: g.system },
                      ...g.turns.map((t) => ({ role: t.role, content: t.text })),
                    ],
                    output: g.raw,
                    // Thinking tokens are billed as output; `total` is the provider's figure.
                    usageDetails:
                      g.promptTokens !== undefined || g.completionTokens !== undefined
                        ? {
                            input: g.promptTokens ?? 0,
                            output: g.completionTokens ?? 0,
                            reasoning: g.thinkingTokens ?? 0,
                            total:
                              g.totalTokens ??
                              (g.promptTokens ?? 0) +
                                (g.completionTokens ?? 0) +
                                (g.thinkingTokens ?? 0),
                          }
                        : undefined,
                    metadata: {
                      finishReason: g.finishReason,
                      estimatedPromptTokens: g.estimatedPromptTokens,
                      contextWindowTokens: g.contextWindowTokens,
                      contextUsedPct: g.contextUsedPct,
                      droppedHistoryTurns: g.droppedHistoryTurns,
                      latencyMs: g.latencyMs,
                    },
                    level: g.error ? 'ERROR' : undefined,
                    statusMessage: g.error,
                  },
                  { asType: 'generation' },
                )
                .end();
            },
            end(out) {
              root.update({ output: out, level: out.status === 'failed' ? 'ERROR' : undefined });
            },
          };
          try {
            result = await fn(recorder);
          } finally {
            root.end();
          }
        },
      );
      return result;
    },
    async runIngestion(meta, fn) {
      let result!: Awaited<ReturnType<typeof fn>>;
      await propagateAttributes(
        { userId: meta.userId, metadata: { companyId: meta.companyId }, tags: ['ingestion'] },
        async () => {
          const root = startObservation('guideline-ingestion', {
            input: { versionId: meta.versionId, filename: meta.filename },
            metadata: { companyId: meta.companyId },
          });
          const recorder: IngestionRecorder = {
            step(name, data) {
              root.startObservation(name, { output: data }).end();
            },
            embedded(batch) {
              root
                .startObservation(
                  'gemini.embedContent',
                  {
                    model: batch.model,
                    input: { chunks: batch.count },
                    metadata: { dimensions: batch.dimensions, latencyMs: batch.latencyMs },
                  },
                  { asType: 'embedding' },
                )
                .end();
            },
            end(out) {
              root.update({ output: out, level: out.status === 'failed' ? 'ERROR' : undefined });
            },
          };
          try {
            result = await fn(recorder);
          } finally {
            root.end();
          }
        },
      );
      return result;
    },
    score(input) {
      client.score.create({
        traceId: input.traceId,
        name: input.name,
        value: input.value,
        dataType: input.dataType,
        comment: input.comment,
        metadata: input.metadata,
      });
    },
    flush: async () => {
      await Promise.all([processor.forceFlush(), client.flush()]);
    },
    shutdown: async () => {
      await client.flush();
      await provider.shutdown();
    },
  };
}

/** Test double: records everything in memory. */
export function createRecordingTracer() {
  const turns: {
    meta: TurnMeta;
    traceId: string;
    summary?: SummaryRecord;
    retrieval?: Parameters<TurnRecorder['retrieval']>;
    generation?: GenerationRecord;
    end?: Parameters<TurnRecorder['end']>[0];
  }[] = [];
  const ingestions: {
    meta: IngestionMeta;
    steps: { name: string; data: Record<string, number | string> }[];
    batches: Parameters<IngestionRecorder['embedded']>[0][];
    end?: Parameters<IngestionRecorder['end']>[0];
  }[] = [];
  const scores: ScoreInput[] = [];
  const tracer: Tracer & {
    turns: typeof turns;
    ingestions: typeof ingestions;
    scores: ScoreInput[];
  } = {
    turns,
    ingestions,
    scores,
    async runTurn(meta, fn) {
      const entry: (typeof turns)[number] = { meta, traceId: `trace-${turns.length + 1}` };
      turns.push(entry);
      return fn({
        traceId: entry.traceId,
        summary: (s) => {
          entry.summary = s;
        },
        retrieval: (query, out) => {
          entry.retrieval = [query, out];
        },
        generation: (g) => {
          entry.generation = g;
        },
        end: (out) => {
          entry.end = out;
        },
      });
    },
    async runIngestion(meta, fn) {
      const entry: (typeof ingestions)[number] = { meta, steps: [], batches: [] };
      ingestions.push(entry);
      return fn({
        step: (name, data) => {
          entry.steps.push({ name, data });
        },
        embedded: (b) => {
          entry.batches.push(b);
        },
        end: (out) => {
          entry.end = out;
        },
      });
    },
    score: (s) => {
      scores.push(s);
    },
    flush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
  return tracer;
}
