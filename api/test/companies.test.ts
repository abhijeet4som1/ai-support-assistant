import { createTestApp } from './helpers/test-app.js';

interface CompanyBody {
  company: {
    id: string;
    name: string;
    description?: string;
    conversationCount: number;
    activeGuidelines?: unknown;
  };
}

describe('companies', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
  });
  afterAll(() => t.close());

  it('starts empty', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/companies', headers: auth });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ items: unknown[] }>().items).toEqual([]);
  });

  it('creates a company (201) and normalises whitespace', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: '  Bookshop   Ltd ', description: 'Online bookstore' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<CompanyBody>();
    expect(body.company).toMatchObject({
      name: 'Bookshop Ltd',
      description: 'Online bookstore',
      conversationCount: 0,
    });
    expect(body.company.activeGuidelines).toBeUndefined();
  });

  it('rejects a duplicate name case-insensitively with ConflictError', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: 'bookshop ltd' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.headers['x-amzn-errortype']).toBe('ConflictError');
    expect(res.json<{ message: string }>().message).toMatch(/already exists/);
  });

  it('validates the name', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ fieldList: { path: string }[] }>().fieldList[0]?.path).toBe('/name');
  });

  it('lists, gets and updates', async () => {
    const list = await t.app.inject({ method: 'GET', url: '/api/companies', headers: auth });
    const items = list.json<{ items: { id: string; name: string }[] }>().items;
    expect(items.map((c) => c.name)).toEqual(['Bookshop Ltd']);
    const id = items[0]!.id;

    const get = await t.app.inject({ method: 'GET', url: `/api/companies/${id}`, headers: auth });
    expect(get.statusCode).toBe(200);
    expect(get.json<CompanyBody>().company.id).toBe(id);

    const upd = await t.app.inject({
      method: 'PATCH',
      url: `/api/companies/${id}`,
      headers: auth,
      payload: { description: 'Books and more' },
    });
    expect(upd.statusCode).toBe(200);
    expect(upd.json<CompanyBody>().company).toMatchObject({
      name: 'Bookshop Ltd',
      description: 'Books and more',
    });
  });

  it('returns NotFoundError for unknown ids', async () => {
    const res = await t.app.inject({
      method: 'GET',
      url: '/api/companies/00000000-0000-0000-0000-000000000000',
      headers: auth,
    });
    expect(res.statusCode).toBe(404);
    expect(res.headers['x-amzn-errortype']).toBe('NotFoundError');
  });
});
