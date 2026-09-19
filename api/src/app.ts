import { randomUUID } from 'node:crypto';

import Fastify, { type FastifyError } from 'fastify';

import { createTokenSigner } from './auth/jwt.js';
import { createRefreshTokenStore } from './auth/refresh-tokens.js';
import { createAuthService } from './auth/service.js';
import { createCompaniesService } from './companies/service.js';
import { type Config } from './config.js';
import { createConversationsService } from './conversations/service.js';
import { type Db } from './db/client.js';
import { createFeedbackService } from './feedback/service.js';
import { createGuidelinesService } from './guidelines/service.js';
import { buildService } from './handlers/index.js';
import { registerDocs } from './http/docs.js';
import { registerSmithyAdapter } from './http/smithy-adapter.js';
import { type JobQueue } from './jobs/queue.js';
import { loggerOptions } from './logger.js';
import { type Tracer } from './observability/tracer.js';
import { type Embedder } from './rag/embeddings.js';
import { type ChatModel } from './rag/llm.js';

export interface AppDeps {
  config: Config;
  db: Db;
  queue: JobQueue;
  embedder: Embedder;
  chatModel: ChatModel;
  tracer: Tracer;
}

export async function buildApp({ config, db, queue, embedder, chatModel, tracer }: AppDeps) {
  const app = Fastify({
    logger: loggerOptions(config),
    genReqId: (req) => {
      const incoming = req.headers['x-request-id'];
      return typeof incoming === 'string' && incoming ? incoming : randomUUID();
    },
    requestIdHeader: 'x-request-id',
    bodyLimit: Math.ceil(config.MAX_UPLOAD_MB * 1024 * 1024) + 64 * 1024,
    trustProxy: true,
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  app.setErrorHandler((err: FastifyError, req, reply) => {
    req.log.error({ err }, 'unhandled error');
    const status =
      typeof err.statusCode === 'number' && err.statusCode >= 400 ? err.statusCode : 500;
    void reply.status(status).send({
      message: status >= 500 ? 'Internal server error' : err.message,
      requestId: req.id,
    });
  });

  const tokens = createTokenSigner(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_MINUTES);
  const refreshTokens = createRefreshTokenStore(db, config.REFRESH_TOKEN_TTL_DAYS);
  const auth = createAuthService(db, tokens, refreshTokens);
  const companies = createCompaniesService(db);
  const feedback = createFeedbackService(db, embedder, tracer);
  const conversations = createConversationsService({
    db,
    embedder,
    chatModel,
    config,
    log: app.log,
    tracer,
  });
  const guidelines = createGuidelinesService(db, queue, {
    maxUploadBytes: Math.ceil(config.MAX_UPLOAD_MB * 1024 * 1024),
  });

  await registerDocs(app);
  registerSmithyAdapter(app, {
    service: buildService({ auth, companies, guidelines, conversations, feedback }),
    auth,
  });

  return { app, services: { auth, companies, guidelines, conversations, feedback } };
}

export type App = Awaited<ReturnType<typeof buildApp>>['app'];
