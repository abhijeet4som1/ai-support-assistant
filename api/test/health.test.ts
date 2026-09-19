import { createTestApp } from './helpers/test-app.js';

describe('GET /api/health', () => {
  it('responds ok without authentication and echoes the request id', async () => {
    const t = await createTestApp();
    const res = await t.app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { 'x-request-id': 'abc-123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ status: string }>()).toMatchObject({ status: 'ok', service: 'api' });
    expect(res.headers['x-request-id']).toBe('abc-123');
    await t.close();
  });

  it('serves the generated OpenAPI document and Swagger UI', async () => {
    const t = await createTestApp();
    const doc = await t.app.inject({ method: 'GET', url: '/api/openapi.json' });
    expect(doc.statusCode).toBe(200);
    expect(doc.json<{ info: { title: string } }>().info.title).toBe('AI Support Assistant API');
    const ui = await t.app.inject({ method: 'GET', url: '/api/docs/' });
    expect(ui.statusCode).toBe(200);
    expect(ui.headers['content-type']).toMatch(/text\/html/);
    await t.close();
  });
});
