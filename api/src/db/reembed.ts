/**
 * Re-embeds every stored vector with the configured embedding model.
 *
 * Run once after changing `GEMINI_EMBEDDING_MODEL`: chunk vectors and query vectors must come from
 * the same model, otherwise similarity scores are meaningless and retrieval silently degrades.
 * The dimension must stay the same (a dimension change also needs a schema migration). The api and
 * worker can keep running; each row is replaced in place and retrieval keeps working throughout,
 * mixing old and new vectors only until the run finishes.
 *
 * CLI usage: pnpm db:reembed
 */
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';

import { type Db, schema } from './client.js';
import { type Embedder } from '../rag/embeddings.js';

export interface ReembedResult {
  chunks: number;
  feedback: number;
}

export async function reembedAll(
  db: Db,
  embedder: Embedder,
  opts: {
    batchSize?: number;
    onProgress?: (done: number, total: number, what: string) => void;
  } = {},
): Promise<ReembedResult> {
  const batchSize = opts.batchSize ?? 50;
  const progress = (done: number, total: number, what: string) =>
    opts.onProgress?.(done, total, what);

  // Guideline sections of every ready version (superseded and failed versions are never retrieved).
  const readyVersions = await db
    .select({ id: schema.guidelineVersions.id })
    .from(schema.guidelineVersions)
    .where(eq(schema.guidelineVersions.status, 'ready'));
  const versionIds = readyVersions.map((v) => v.id);
  const chunks =
    versionIds.length === 0
      ? []
      : await db
          .select({
            id: schema.guidelineChunks.id,
            title: schema.guidelineChunks.title,
            content: schema.guidelineChunks.content,
          })
          .from(schema.guidelineChunks)
          .where(
            and(
              inArray(schema.guidelineChunks.versionId, versionIds),
              isNotNull(schema.guidelineChunks.embedding),
            ),
          )
          .orderBy(asc(schema.guidelineChunks.versionId), asc(schema.guidelineChunks.ordinal));
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    // Same text shape as the ingestion job, so re-embedding is equivalent to a fresh ingest.
    const vectors = await embedder.embedDocuments(
      batch.map((c) => (c.title ? `${c.title}\n${c.content}` : c.content)),
    );
    for (let j = 0; j < batch.length; j++) {
      await db
        .update(schema.guidelineChunks)
        .set({ embedding: vectors[j]! })
        .where(eq(schema.guidelineChunks.id, batch[j]!.id));
    }
    progress(Math.min(i + batchSize, chunks.length), chunks.length, 'chunks');
  }

  // Correction queries (embedded as queries, like the customer messages they are matched against).
  const corrections = await db
    .select({ id: schema.feedback.id, queryText: schema.feedback.queryText })
    .from(schema.feedback)
    .where(isNotNull(schema.feedback.queryEmbedding))
    .orderBy(asc(schema.feedback.createdAt));
  for (let i = 0; i < corrections.length; i++) {
    const row = corrections[i]!;
    const queryEmbedding = await embedder.embedQuery(row.queryText);
    await db.update(schema.feedback).set({ queryEmbedding }).where(eq(schema.feedback.id, row.id));
    progress(i + 1, corrections.length, 'corrections');
  }

  return { chunks: chunks.length, feedback: corrections.length };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { loadConfig } = await import('../config.js');
  const { createDb } = await import('./client.js');
  const { createLogger } = await import('../logger.js');
  const { createGeminiEmbedder } = await import('../rag/embeddings.js');
  const { EMBEDDING_DIMENSIONS } = await import('./schema.js');
  const cfg = loadConfig();
  if (cfg.GEMINI_EMBEDDING_DIMENSIONS !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `GEMINI_EMBEDDING_DIMENSIONS=${cfg.GEMINI_EMBEDDING_DIMENSIONS} does not match the database vector size (${EMBEDDING_DIMENSIONS}); a dimension change needs a migration, not a re-embed.`,
    );
  }
  const log = createLogger(cfg).child({ service: 'reembed' });
  const embedder = createGeminiEmbedder({
    apiKey: cfg.GEMINI_API_KEY,
    model: cfg.GEMINI_EMBEDDING_MODEL,
    dimensions: cfg.GEMINI_EMBEDDING_DIMENSIONS,
    timeoutMs: cfg.GEMINI_TIMEOUT_MS,
    log,
  });
  const { db, close } = createDb(cfg.DATABASE_URL);
  log.info({ model: embedder.model, dimensions: embedder.dimensions }, 're-embedding all vectors');
  const result = await reembedAll(db, embedder, {
    onProgress: (done, total, what) => log.info({ done, total, what }, 'progress'),
  });
  await close();
  log.info(result, 're-embedding complete');
}
