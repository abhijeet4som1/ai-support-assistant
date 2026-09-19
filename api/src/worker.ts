/**
 * Background worker: consumes ingestion jobs from pg-boss (Postgres) and processes
 * guideline uploads (parse → chunk → embed). Same image as the api, different entry point.
 */
import { loadConfig } from './config.js';
import { createDb } from './db/client.js';
import { EMBEDDING_DIMENSIONS } from './db/schema.js';
import { createIngestionJob, type IngestPayload } from './ingestion/job.js';
import { createPgBossQueue, QUEUES } from './jobs/queue.js';
import { createLogger } from './logger.js';
import { createTracerFromConfig } from './observability/tracer.js';
import { createGeminiEmbedder } from './rag/embeddings.js';

const config = loadConfig();
if (config.GEMINI_EMBEDDING_DIMENSIONS !== EMBEDDING_DIMENSIONS) {
  throw new Error(
    `GEMINI_EMBEDDING_DIMENSIONS=${config.GEMINI_EMBEDDING_DIMENSIONS} does not match the database vector size (${EMBEDDING_DIMENSIONS}). ` +
      'Changing the embedding size requires a migration and re-ingesting all guidelines (see api/README.md).',
  );
}
const log = createLogger(config).child({ service: 'worker' });

const { db, close } = createDb(config.DATABASE_URL);
const queue = await createPgBossQueue(config.DATABASE_URL, log);
const embedder = createGeminiEmbedder({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_EMBEDDING_MODEL,
  dimensions: config.GEMINI_EMBEDDING_DIMENSIONS,
  timeoutMs: config.GEMINI_TIMEOUT_MS,
  log,
});

const tracer = createTracerFromConfig(config, log);
const ingest = createIngestionJob({ db, embedder, log, tracer });
await queue.subscribe<IngestPayload>(QUEUES.ingestGuidelines, (payload, jobId) => {
  log.info({ jobId, versionId: payload.versionId }, 'ingestion job started');
  return ingest(payload);
});
log.info({ model: embedder.model, dimensions: embedder.dimensions }, 'worker ready');

const shutdown = async (signal: string) => {
  log.info({ signal }, 'worker shutting down');
  await queue.stop();
  await tracer.shutdown();
  await close();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
