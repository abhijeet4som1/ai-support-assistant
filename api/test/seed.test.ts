import { pino } from 'pino';

import { createTestApp } from './helpers/test-app.js';
import { seedCompanies } from '../src/db/seed.js';

describe('seed', () => {
  it('creates the two sample companies and ingests their guidelines', async () => {
    const t = await createTestApp();
    const created = await seedCompanies(t.db, t.services.guidelines, pino({ level: 'silent' }));
    expect(created).toEqual(['Bookshop', 'VPN SaaS']);
    await t.runJobs();
    const auth = { authorization: `Bearer ${await t.login()}` };
    const res = await t.app.inject({ method: 'GET', url: '/api/companies', headers: auth });
    const items = res.json<{
      items: { name: string; activeGuidelines?: { chunksTotal: number } }[];
    }>().items;
    expect(items.map((c) => [c.name, c.activeGuidelines?.chunksTotal])).toEqual([
      ['Bookshop', 7],
      ['VPN SaaS', 10],
    ]);
    // idempotent
    expect(await seedCompanies(t.db, t.services.guidelines, pino({ level: 'silent' }))).toEqual([]);
    await t.close();
  });
});
