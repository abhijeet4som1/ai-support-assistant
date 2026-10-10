/**
 * Database schema (Drizzle ORM, PostgreSQL + pgvector).
 * Migrations are generated from this file with `pnpm db:generate` into ./drizzle.
 */
import { type AssistantGuidance } from '@app/api-server-sdk';
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

/**
 * Embedding dimensionality is fixed at the schema level (pgvector indexes need it).
 * Must match GEMINI_EMBEDDING_DIMENSIONS; changing it requires a migration + re-ingest.
 */
export const EMBEDDING_DIMENSIONS = 768;

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

const vector = customType<{ data: number[]; driverData: string }>({
  dataType: () => `vector(${EMBEDDING_DIMENSIONS})`,
  toDriver: (value) => `[${value.join(',')}]`,
  // pgvector renders vectors as "[0.1,0.2,...]"
  fromDriver: (value) =>
    value
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(Number),
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

export const guidelineStatusEnum = pgEnum('guideline_status', [
  'queued',
  'parsing',
  'chunking',
  'embedding',
  'ready',
  'failed',
  'superseded',
]);
export const messageRoleEnum = pgEnum('message_role', ['customer', 'instruction', 'assistant']);
export const messageStatusEnum = pgEnum('message_status', ['ok', 'failed']);
export const coverageEnum = pgEnum('coverage', ['covered', 'partial', 'not_covered']);
export const feedbackRatingEnum = pgEnum('feedback_rating', ['up', 'down']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  ...timestamps,
});

/**
 * Refresh tokens are stored hashed. `familyId` groups the chain of rotations that started at one
 * login; reuse of an already-rotated token revokes the whole family (theft detection).
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedBy: uuid('replaced_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('refresh_tokens_family_idx').on(t.familyId),
    index('refresh_tokens_user_idx').on(t.userId),
  ],
);

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    /** Points at the guideline version used for chat; only ever a `ready` version. */
    activeGuidelineVersionId: uuid('active_guideline_version_id').references(
      (): AnyPgColumn => guidelineVersions.id,
      { onDelete: 'set null' },
    ),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (t) => [uniqueIndex('companies_name_lower_idx').on(sql`lower(${t.name})`)],
);

export const guidelineVersions = pgTable(
  'guideline_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Monotonic per-table sequence used to order versions deterministically. */
    seq: bigserial('seq', { mode: 'number' }).notNull().unique(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256').notNull(),
    /** Original upload, kept so the worker needs no shared volume and for re-processing. */
    fileBytes: bytea('file_bytes').notNull(),
    rawText: text('raw_text'),
    status: guidelineStatusEnum('status').notNull().default('queued'),
    chunksTotal: integer('chunks_total').notNull().default(0),
    chunksEmbedded: integer('chunks_embedded').notNull().default(0),
    error: text('error'),
    jobId: text('job_id'),
    supersededBy: uuid('superseded_by'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('guideline_versions_company_seq_idx').on(t.companyId, t.seq)],
);

export const guidelineChunks = pgTable(
  'guideline_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    versionId: uuid('version_id')
      .notNull()
      .references(() => guidelineVersions.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    title: text('title'),
    content: text('content').notNull(),
    tokenCount: integer('token_count').notNull(),
    /** NULL until the worker has embedded the chunk (makes ingestion resumable). */
    embedding: vector('embedding'),
    /**
     * Full-text index of title + content (English stemming), maintained by Postgres. Used by the
     * keyword rescue in retrieval: a section that the vector ranking missed but that contains the
     * customer's decisive word ("cancel") is appended to the retrieved set.
     */
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(title, '') || ' ' || content)`,
    ),
  },
  (t) => [
    index('guideline_chunks_version_idx').on(t.versionId, t.ordinal),
    index('guideline_chunks_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
    index('guideline_chunks_search_idx').using('gin', t.searchVector),
  ],
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default(''),
    /** Rolling summary of messages that no longer fit the history window, and the last message it covers. */
    historySummary: text('history_summary'),
    historySummaryUpto: uuid('history_summary_upto'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    /** Coverage of the latest assistant answer, denormalised so the history filter is an indexed equality. */
    lastCoverage: coverageEnum('last_coverage'),
    ...timestamps,
  },
  (t) => [
    index('conversations_company_last_idx').on(t.companyId, t.lastMessageAt),
    index('conversations_last_idx').on(t.lastMessageAt),
    index('conversations_coverage_last_idx').on(t.lastCoverage, t.lastMessageAt),
  ],
);

export interface RetrievedChunkRecord {
  chunkId: string;
  title: string | null;
  score: number;
  via?: 'correction' | 'keyword';
}
export interface UsedCorrectionRecord {
  correctionId: string;
  score: number;
}

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    status: messageStatusEnum('status').notNull().default('ok'),
    error: text('error'),
    /** Structured assistant output (AssistantGuidance) for assistant messages. */
    guidance: jsonb('guidance').$type<AssistantGuidance>(),
    coverage: coverageEnum('coverage'),
    retrieval: jsonb('retrieval').$type<RetrievedChunkRecord[]>(),
    correctionsUsed: jsonb('corrections_used').$type<UsedCorrectionRecord[]>(),
    guidelineVersionId: uuid('guideline_version_id'),
    model: text('model'),
    promptTokens: integer('prompt_tokens'),
    /** Visible answer tokens; thinking tokens are reported separately by the provider. */
    completionTokens: integer('completion_tokens'),
    thinkingTokens: integer('thinking_tokens'),
    /** Provider-reported total for the call (prompt + thinking + answer). */
    totalTokens: integer('total_tokens'),
    latencyMs: integer('latency_ms'),
    /** Observability trace id (Langfuse) of the turn that produced this answer; feedback scores attach to it. */
    traceId: text('trace_id'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_conversation_created_idx').on(t.conversationId, t.createdAt)],
);

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    rating: feedbackRatingEnum('rating').notNull(),
    whatWasWrong: text('what_was_wrong'),
    correctedAnswer: text('corrected_answer'),
    /** The customer message that led to the rated answer; embedded for similarity retrieval. */
    queryText: text('query_text').notNull(),
    queryEmbedding: vector('query_embedding'),
    guidelineVersionId: uuid('guideline_version_id').notNull(),
    active: boolean('active').notNull().default(true),
    score: doublePrecision('score'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('feedback_message_user_idx').on(t.messageId, t.userId),
    index('feedback_company_active_idx').on(t.companyId, t.active),
    index('feedback_embedding_idx').using('hnsw', t.queryEmbedding.op('vector_cosine_ops')),
  ],
);

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type GuidelineVersion = typeof guidelineVersions.$inferSelect;
export type GuidelineChunk = typeof guidelineChunks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
