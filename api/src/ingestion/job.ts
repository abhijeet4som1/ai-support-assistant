/**
 * Background ingestion of one guideline version: parse → chunk → embed → ready.
 * Each stage re-reads the version and stops quietly if it was superseded. Embedding is
 * resumable: chunks are inserted with NULL embeddings and filled in batches.
 */
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { type Logger } from 'pino';

import { chunkText } from './chunker.js';
import { detectFileKind, extractText } from './parsers.js';
import { type Db, schema } from '../db/client.js';
import { setActiveVersion } from '../guidelines/service.js';
import { providerErrorMessage } from '../lib/unknown.js';
import { createNoopTracer, type IngestionRecorder, type Tracer } from '../observability/tracer.js';
import { type Embedder } from '../rag/embeddings.js';

export interface IngestionDeps {
  db: Db;
  embedder: Embedder;
  log: Logger;
  embedBatchSize?: number;
  tracer?: Tracer;
}

export interface IngestPayload {
  versionId: string;
}

type Status = (typeof schema.guidelineStatusEnum.enumValues)[number];

export function createIngestionJob({
  db,
  embedder,
  log,
  embedBatchSize = 50,
  tracer = createNoopTracer(),
}: IngestionDeps) {
  const load = (id: string) =>
    db.query.guidelineVersions.findFirst({ where: eq(schema.guidelineVersions.id, id) });

  async function setStatus(
    id: string,
    status: Status,
    extra: Partial<typeof schema.guidelineVersions.$inferInsert> = {},
  ) {
    await db
      .update(schema.guidelineVersions)
      .set({ status, ...extra })
      .where(eq(schema.guidelineVersions.id, id));
  }

  /** Advances to `next` unless the version was superseded meanwhile. Returns false to stop. */
  async function advance(id: string, next: Status): Promise<boolean> {
    const v = await load(id);
    if (!v) return false;
    if (v.status === 'superseded') {
      log.info({ versionId: id }, 'ingestion stopped: version superseded');
      return false;
    }
    await setStatus(id, next);
    return true;
  }

  return async function ingest({ versionId }: IngestPayload) {
    const jobLog = log.child({ versionId });
    const version = await load(versionId);
    if (!version) {
      jobLog.warn('ingestion skipped: version no longer exists');
      return;
    }
    if (version.status === 'superseded' || version.status === 'ready') return;
    const meta = {
      versionId,
      companyId: version.companyId,
      filename: version.filename,
      userId: version.createdBy,
    };
    await tracer.runIngestion(meta, (rec) => run(version, rec, jobLog));
  };

  async function run(
    version: schema.GuidelineVersion,
    rec: IngestionRecorder,
    jobLog: Logger,
  ): Promise<void> {
    const versionId = version.id;
    try {
      // 1. Parse (skipped when resuming after the text was already extracted).
      let text = version.rawText;
      if (!text) {
        if (!(await advance(versionId, 'parsing'))) {
          rec.end({ status: 'superseded' });
          return;
        }
        const { kind } = detectFileKind(version.filename, version.fileBytes, version.contentType);
        text = (await extractText(kind, version.fileBytes)).trim();
        if (!text) throw new Error('No readable text found in the file');
        await setStatus(versionId, 'parsing', { rawText: text });
        rec.step('parse', { kind, characters: text.length });
      }

      // 2. Chunk (skipped when chunks already exist from a previous attempt).
      const existing = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.guidelineChunks)
        .where(eq(schema.guidelineChunks.versionId, versionId));
      if ((existing[0]?.n ?? 0) === 0) {
        if (!(await advance(versionId, 'chunking'))) {
          rec.end({ status: 'superseded' });
          return;
        }
        const chunks = chunkText(text);
        if (chunks.length === 0) throw new Error('The document produced no chunks');
        await db.insert(schema.guidelineChunks).values(
          chunks.map((c) => ({
            versionId,
            companyId: version.companyId,
            ordinal: c.ordinal,
            title: c.title,
            content: c.content,
            tokenCount: c.tokenCount,
          })),
        );
        await setStatus(versionId, 'chunking', { chunksTotal: chunks.length, chunksEmbedded: 0 });
        rec.step('chunk', {
          chunks: chunks.length,
          tokens: chunks.reduce((s, c) => s + c.tokenCount, 0),
        });
      }

      // 3. Embed in batches; resumable.
      if (!(await advance(versionId, 'embedding'))) {
        rec.end({ status: 'superseded' });
        return;
      }
      for (;;) {
        const batch = await db
          .select({
            id: schema.guidelineChunks.id,
            title: schema.guidelineChunks.title,
            content: schema.guidelineChunks.content,
          })
          .from(schema.guidelineChunks)
          .where(
            and(
              eq(schema.guidelineChunks.versionId, versionId),
              isNull(schema.guidelineChunks.embedding),
            ),
          )
          .orderBy(asc(schema.guidelineChunks.ordinal))
          .limit(embedBatchSize);
        if (batch.length === 0) break;
        const started = Date.now();
        const vectors = await embedder.embedDocuments(
          batch.map((c) => (c.title ? `${c.title}\n${c.content}` : c.content)),
        );
        rec.embedded({
          count: batch.length,
          model: embedder.model,
          dimensions: embedder.dimensions,
          latencyMs: Date.now() - started,
        });
        for (let i = 0; i < batch.length; i++) {
          await db
            .update(schema.guidelineChunks)
            .set({ embedding: vectors[i]! })
            .where(eq(schema.guidelineChunks.id, batch[i]!.id));
        }
        await db
          .update(schema.guidelineVersions)
          .set({
            chunksEmbedded: sql`${schema.guidelineVersions.chunksEmbedded} + ${batch.length}`,
          })
          .where(eq(schema.guidelineVersions.id, versionId));
        const fresh = await load(versionId);
        if (fresh?.status === 'superseded') {
          jobLog.info('ingestion stopped during embedding: version superseded');
          rec.end({ status: 'superseded' });
          return;
        }
      }

      // 4. Ready + activate (never overwrites a newer active version).
      if (!(await advance(versionId, 'ready'))) {
        rec.end({ status: 'superseded' });
        return;
      }
      await setStatus(versionId, 'ready', { readyAt: new Date(), error: null });
      await setActiveVersion(db, version.companyId, versionId, { force: false });
      rec.end({ status: 'ready' });
      jobLog.info('ingestion complete');
    } catch (err) {
      const message = describeError(err);
      jobLog.error({ err }, 'ingestion failed');
      await setStatus(versionId, 'failed', { error: message });
      rec.end({ status: 'failed', error: message });
      throw err; // let the queue retry with backoff
    }
  }
}

/** Human-readable failure reason; unwraps the JSON envelope Gemini puts in ApiError messages. */
export function describeError(err: unknown): string {
  const message = providerErrorMessage(err) ?? String(err);
  return message.length > 500 ? `${message.slice(0, 500)}…` : message;
}
