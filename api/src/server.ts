import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { EMBEDDING_DIMENSIONS } from './db/schema.js';
import { runSeed } from './db/seed.js';
import { createPgBossQueue } from './jobs/queue.js';
import { createLogger } from './logger.js';
import { createTracerFromConfig } from './observability/tracer.js';
import { createGeminiEmbedder } from './rag/embeddings.js';
import { createGeminiChatModel } from './rag/llm.js';

const config = loadConfig();
if (config.GEMINI_EMBEDDING_DIMENSIONS !== EMBEDDING_DIMENSIONS) {
  throw new Error(
    `GEMINI_EMBEDDING_DIMENSIONS=${config.GEMINI_EMBEDDING_DIMENSIONS} does not match the database vector size (${EMBEDDING_DIMENSIONS}). ` +
      'Changing the embedding size requires a migration and re-ingesting all guidelines (see api/README.md).',
  );
}
const log = createLogger(config);

const { db, close } = createDb(config.DATABASE_URL);
await runMigrations(db);
log.info('database migrations applied');

const queue = await createPgBossQueue(config.DATABASE_URL, log);
const embedder = createGeminiEmbedder({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_EMBEDDING_MODEL,
  dimensions: config.GEMINI_EMBEDDING_DIMENSIONS,
  timeoutMs: config.GEMINI_TIMEOUT_MS,
  log,
});
const chatModel = createGeminiChatModel({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_CHAT_MODEL,
  timeoutMs: config.GEMINI_TIMEOUT_MS,
  log,
});
const tracer = createTracerFromConfig(config, log);
const { app, services } = await buildApp({ config, db, queue, embedder, chatModel, tracer });
await runSeed(db, services.guidelines, log, config.SEED_USERS);

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  await tracer.shutdown();
  await queue.stop();
  await close();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
