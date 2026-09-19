/**
 * Bridges Fastify and the generated Smithy server SDK:
 * Fastify request  →  @smithy HttpRequest  →  SSDK handler  →  HttpResponse  →  Fastify reply.
 */
import {
  getSupportAssistantServiceHandler,
  type SupportAssistantService,
} from '@app/api-server-sdk';
import { HttpRequest } from '@smithy/core/protocols';
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';

import { isPublicRoute, loadPublicRoutes } from './public-routes.js';
import { bearerFromHeader, type AuthService } from '../auth/service.js';
import { type HandlerContext } from '../handlers/context.js';

export interface AdapterDeps {
  service: SupportAssistantService<HandlerContext>;
  auth: AuthService;
}

function toHeaders(req: FastifyRequest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v) ? v.join(', ') : v;
  }
  return out;
}

function toQuery(req: FastifyRequest): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  const query: unknown = req.query;
  if (typeof query !== 'object' || query === null) return out;
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === 'string') out[k] = v;
    else if (Array.isArray(v) && v.every((x): x is string => typeof x === 'string')) out[k] = v;
  }
  return out;
}

export function registerSmithyAdapter(app: FastifyInstance, deps: AdapterDeps) {
  const handler = getSupportAssistantServiceHandler<HandlerContext>(deps.service);
  const publicRoutes = loadPublicRoutes();

  // Hand raw bodies to the SSDK untouched; it does its own (de)serialization and validation.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser('*', (_req, payload, done) => done(null, payload));

  const dispatch = async (req: FastifyRequest, reply: FastifyReply) => {
    const authorization = req.headers.authorization;
    const bearer = bearerFromHeader(authorization);
    const user = (await deps.auth.authenticate(bearer)) ?? undefined;
    const ctx: HandlerContext = {
      requestId: req.id,
      log: req.log,
      user,
      badToken: Boolean(authorization) && !user,
    };
    if (user) req.log = req.log.child({ userId: user.id });

    const url = new URL(req.url, 'http://local');

    // Authenticate before the SDK parses/validates the body: no token, no information.
    if (!user && !isPublicRoute(publicRoutes, req.method, url.pathname)) {
      return reply
        .status(401)
        .header('content-type', 'application/json')
        .header('x-amzn-errortype', 'UnauthorizedError')
        .send({
          message: ctx.badToken
            ? 'Your session is invalid or has expired. Please log in again.'
            : 'Authentication required',
          requestId: req.id,
        });
    }
    const httpRequest = new HttpRequest({
      method: req.method,
      protocol: 'http:',
      hostname: req.hostname,
      path: url.pathname,
      query: toQuery(req),
      headers: toHeaders(req),
      body: req.body,
    });

    const res = await handler.handle(httpRequest, ctx);
    void reply.status(res.statusCode);
    for (const [k, v] of Object.entries(res.headers)) void reply.header(k, v);
    return reply.send(res.body);
  };

  app.all('/api/*', dispatch);
  app.all('/api', dispatch);
}
