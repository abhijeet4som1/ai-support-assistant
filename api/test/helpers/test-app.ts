import { pino } from 'pino';

import { createTestDb } from './test-db.js';
import { buildApp } from '../../src/app.js';
import { seedUsers } from '../../src/auth/users.js';
import { loadConfig } from '../../src/config.js';
import { createIngestionJob, type IngestPayload } from '../../src/ingestion/job.js';
import { createInMemoryQueue, QUEUES } from '../../src/jobs/queue.js';
import { createRecordingTracer } from '../../src/observability/tracer.js';
import { createFakeEmbedder } from '../../src/rag/embeddings.js';
import { createFakeChatModel } from '../../src/rag/llm.js';

export const testConfig = loadConfig({
  DATABASE_URL: 'postgres://unused',
  JWT_SECRET: 'test-secret-with-enough-length',
  GEMINI_API_KEY: 'test-key',
  LOG_LEVEL: process.env.TEST_LOG_LEVEL ?? 'silent',
  SEED_USERS: 'agent1:agent1pass,agent2:agent2pass',
  MAX_UPLOAD_MB: '1',
  // The fake embedder (hashed bag of words) yields low cosine scores; lower the gate for tests.
  RAG_MIN_SCORE: '0.05',
  RAG_CORRECTIONS_MIN_SCORE: '0.05',
});

/**
 * Fully wired app on a fresh PGlite database with seed users, an in-memory job queue and a
 * fake embedder. `runJobs()` executes queued ingestion jobs synchronously.
 */
export async function createTestApp(overrides: Partial<typeof testConfig> = {}) {
  const config = { ...testConfig, ...overrides };
  const { db, close } = await createTestDb();
  await seedUsers(db, config.SEED_USERS);
  const queue = createInMemoryQueue();
  const embedder = createFakeEmbedder();
  const chatModel = createFakeChatModel();
  const tracer = createRecordingTracer();
  const log = pino({ level: testConfig.LOG_LEVEL });
  const ingest = createIngestionJob({ db, embedder, log, embedBatchSize: 4, tracer });
  await queue.subscribe<IngestPayload>(QUEUES.ingestGuidelines, (payload) => ingest(payload));
  const { app, services } = await buildApp({
    config,
    db,
    queue,
    embedder,
    chatModel,
    tracer,
  });
  return {
    app,
    services,
    db,
    queue,
    embedder,
    chatModel,
    tracer,
    runJobs: () => queue.drain(),
    async close() {
      await app.close();
      await close();
    },
    async login(username = 'agent1', password = 'agent1pass') {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username, password },
      });
      if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode} ${res.body}`);
      return res.json<{ tokens: { accessToken: string } }>().tokens.accessToken;
    },
  };
}
