/**
 * Keyword rescue on a real (PGlite) database: the VPN guidelines are ingested through the normal
 * upload path, then the rescue query is exercised directly with the fake embedder's vectors.
 */
import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';
import { seedGuidelinesDir } from '../src/db/seed.js';
import { retrieveKeywordRescue } from '../src/rag/retrieval.js';

describe('retrieveKeywordRescue', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let versionId: string;

  const rescue = async (query: string, exclude: string[] = []) =>
    retrieveKeywordRescue(t.db, {
      versionId,
      query,
      vector: await t.embedder.embedQuery(query),
      exclude,
    });

  beforeAll(async () => {
    t = await createTestApp();
    const auth = { authorization: `Bearer ${await t.login()}` };
    const created = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: 'VPN SaaS' },
    });
    const companyId = created.json<{ company: { id: string } }>().company.id;
    const uploaded = await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: {
        ...auth,
        'content-type': 'application/octet-stream',
        'x-filename': 'vpn_support_guidelines.txt',
      },
      payload: await readFile(new URL('vpn_support_guidelines.txt', `file://${seedGuidelinesDir}`)),
    });
    versionId = uploaded.json<{ version: { id: string } }>().version.id;
    await t.runJobs();
  });
  afterAll(() => t.close());

  it('finds the section a distinctive word points at, tagged via keyword', async () => {
    const hit = await rescue("Worst VPN I've ever paid for. Cancel everything.");
    expect(hit).toMatchObject({ title: 'Billing and Subscription Issues', via: 'keyword' });
    expect(hit!.score).toBeGreaterThan(0);
  });

  it('matches stemmed forms (cancelling → cancellations)', async () => {
    const hit = await rescue('I am cancelling, this is useless');
    expect(hit?.title).toBe('Billing and Subscription Issues');
  });

  it('ignores words that occur in most sections and returns null when nothing is distinctive', async () => {
    // "vpn", "server" and "connect" appear in most VPN sections; none identifies one section.
    expect(await rescue('vpn server connect')).toBeNull();
    expect(await rescue('hello there, thanks')).toBeNull();
  });

  it('never returns a section that is already in the retrieved set', async () => {
    const first = await rescue('cancel my subscription');
    const second = await rescue('cancel my subscription', [first!.chunkId]);
    expect(second?.chunkId).not.toBe(first!.chunkId);
  });
});
