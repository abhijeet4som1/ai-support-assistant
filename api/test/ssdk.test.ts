/**
 * Proves the generated Smithy server SDK works at runtime from our ESM api:
 * routing, serialization, automatic validation and framework errors.
 */
import { Readable } from 'node:stream';

import {
  getSupportAssistantServiceHandler,
  type SupportAssistantService,
} from '@app/api-server-sdk';
import { HttpRequest } from '@smithy/core/protocols';

interface Ctx {
  requestId: string;
}

const notImplemented = () => {
  throw new Error('not implemented in this test');
};

// Only Health is implemented; every other operation is a stub.
const service = new Proxy({} as SupportAssistantService<Ctx>, {
  get(_target, prop) {
    if (prop === 'Health') {
      return () =>
        Promise.resolve({ status: 'ok', service: 'api', time: new Date('2026-09-13T00:00:00Z') });
    }
    return notImplemented;
  },
});

const handler = getSupportAssistantServiceHandler<Ctx>(service);

// Mirrors what the Fastify adapter does: raw body as a Node stream, headers as received.
const request = (init: {
  method: string;
  path: string;
  body?: string;
  headers?: Record<string, string>;
}) =>
  new HttpRequest({
    method: init.method,
    hostname: 'localhost',
    path: init.path,
    headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers },
    body: init.body ? Readable.from([Buffer.from(init.body)]) : undefined,
  });

const readBody = (body: unknown) =>
  typeof body === 'string' ? body : Buffer.from(body as Uint8Array).toString();

describe('generated server SDK', () => {
  it('routes GET /api/health and serializes the output', async () => {
    const res = await handler.handle(request({ method: 'GET', path: '/api/health' }), {
      requestId: 'r1',
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(readBody(res.body))).toEqual({
      status: 'ok',
      service: 'api',
      time: '2026-09-13T00:00:00Z',
    });
  });

  it('validates input from constraint traits before calling the handler', async () => {
    const res = await handler.handle(
      request({
        method: 'POST',
        path: '/api/auth/login',
        body: JSON.stringify({ username: '', password: 'x' }),
      }),
      { requestId: 'r2' },
    );
    expect(res.statusCode).toBe(400);
    expect(res.headers['x-amzn-errortype']).toBe('ValidationException');
    const body = JSON.parse(readBody(res.body)) as {
      message: string;
      fieldList: { path: string; message: string }[];
    };
    expect(body.fieldList.map((f) => f.path)).toEqual(['/username']);
  });

  it('answers unknown routes with a framework error instead of crashing', async () => {
    const res = await handler.handle(request({ method: 'GET', path: '/api/nope' }), {
      requestId: 'r3',
    });
    expect(res.statusCode).toBe(404);
    expect(res.headers['x-amzn-errortype']).toBe('UnknownOperationException');
  });
});
