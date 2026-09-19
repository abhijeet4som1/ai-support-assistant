import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';

interface VersionBody {
  version: {
    id: string;
    status: string;
    chunksTotal: number;
    chunksEmbedded: number;
    isActive: boolean;
    error?: string;
  };
}

const sample = (name: string) => readFile(new URL(`../seed/guidelines/${name}`, import.meta.url));

describe('guideline ingestion', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let companyId: string;

  const upload = (body: Buffer | string, filename: string, headers: Record<string, string> = {}) =>
    t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: {
        ...auth,
        'content-type': 'application/octet-stream',
        'x-filename': filename,
        ...headers,
      },
      payload: body,
    });

  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: 'Bookshop' },
    });
    companyId = res.json<{ company: { id: string } }>().company.id;
  });
  afterAll(() => t.close());

  it('reports GuidelinesNotReady before any upload', async () => {
    const res = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}/guidelines`,
      headers: auth,
    });
    expect(res.statusCode).toBe(409);
    expect(res.headers['x-amzn-errortype']).toBe('GuidelinesNotReadyError');
  });

  it('rejects unsupported and oversized files', async () => {
    const bad = await upload('MZ...', 'setup.exe');
    expect(bad.statusCode).toBe(415);
    expect(bad.headers['x-amzn-errortype']).toBe('UnsupportedMediaTypeError');
    const big = await upload(Buffer.alloc(1024 * 1024 + 1, 97), 'big.txt');
    expect(big.statusCode).toBe(413);
  });

  it('accepts an upload (202, queued) and processes it to ready with chunks', async () => {
    const res = await upload(
      await sample('bookshop_support_guidelines.txt'),
      'bookshop_support_guidelines.txt',
    );
    expect(res.statusCode).toBe(202);
    const { version } = res.json<VersionBody>();
    expect(version.status).toBe('queued');
    expect(t.queue.pending).toHaveLength(1);

    await t.runJobs();

    const after = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${version.id}`,
      headers: auth,
    });
    expect(after.json<VersionBody>().version).toMatchObject({
      status: 'ready',
      chunksTotal: 7,
      chunksEmbedded: 7,
      isActive: true,
    });
    const trace = t.tracer.ingestions.at(-1)!;
    expect(trace.steps.map((s) => s.name)).toEqual(['parse', 'chunk']);
    expect(trace.batches.reduce((n, b) => n + b.count, 0)).toBe(7);
    expect(trace.end?.status).toBe('ready');

    const active = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}/guidelines`,
      headers: auth,
    });
    expect(active.statusCode).toBe(200);
    const body = active.json<{
      version: { id: string };
      text: string;
      chunks: { title?: string }[];
    }>();
    expect(body.version.id).toBe(version.id);
    expect(body.text).toContain('Shipping Issues');
    expect(body.chunks.map((c) => c.title)).toContain('Returns and Refunds');
  });

  it('is a no-op when the same file is uploaded again', async () => {
    const res = await upload(
      await sample('bookshop_support_guidelines.txt'),
      'bookshop_support_guidelines.txt',
    );
    expect(res.statusCode).toBe(202);
    expect(res.json<VersionBody>().version.status).toBe('ready');
    expect(t.queue.pending).toHaveLength(0);
  });

  it('rejects an upload when a newer version exists than the client saw', async () => {
    const list = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}/guidelines/versions`,
      headers: auth,
    });
    const latestId = list.json<{ items: { id: string }[] }>().items[0]!.id;
    const conflict = await upload(await sample('vpn_support_guidelines.txt'), 'vpn.txt', {
      'x-expected-version': 'stale-id',
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.headers['x-amzn-errortype']).toBe('GuidelinesConflictError');
    expect(conflict.json<{ latestVersionId: string }>().latestVersionId).toBe(latestId);
    const ok = await upload(await sample('vpn_support_guidelines.txt'), 'vpn.txt', {
      'x-expected-version': latestId,
    });
    expect(ok.statusCode).toBe(202);
  });

  it('keeps the previous version active until the new one is ready, then flips', async () => {
    const company = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}`,
      headers: auth,
    });
    const c = company.json<{
      company: { activeGuidelines: { filename: string }; latestGuidelines: { status: string } };
    }>().company;
    expect(c.activeGuidelines.filename).toBe('bookshop_support_guidelines.txt');
    expect(c.latestGuidelines.status).toBe('queued');

    await t.runJobs();

    const after = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}`,
      headers: auth,
    });
    const c2 = after.json<{
      company: { activeGuidelines: { filename: string; chunksTotal: number } };
    }>().company;
    expect(c2.activeGuidelines).toMatchObject({ filename: 'vpn.txt', chunksTotal: 10 });
  });

  it('supersedes an in-flight version when a newer upload arrives', async () => {
    const first = await upload('1. Topic A\nSome guidance.\n', 'a.txt');
    const second = await upload('1. Topic B\nOther guidance.\n', 'b.txt');
    const firstId = first.json<VersionBody>().version.id;
    const secondId = second.json<VersionBody>().version.id;
    const v1 = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${firstId}`,
      headers: auth,
    });
    expect(v1.json<VersionBody>().version.status).toBe('superseded');
    await t.runJobs();
    const v1after = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${firstId}`,
      headers: auth,
    });
    expect(v1after.json<VersionBody>().version.status).toBe('superseded');
    const v2 = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${secondId}`,
      headers: auth,
    });
    expect(v2.json<VersionBody>().version).toMatchObject({ status: 'ready', isActive: true });
  });

  it('can re-activate an older ready version (rollback) and lists versions newest first', async () => {
    const list = await t.app.inject({
      method: 'GET',
      url: `/api/companies/${companyId}/guidelines/versions`,
      headers: auth,
    });
    const items = list.json<{
      items: { id: string; filename: string; status: string; isActive: boolean }[];
    }>().items;
    expect(items[0]!.filename).toBe('b.txt');
    const vpn = items.find((v) => v.filename === 'vpn.txt')!;
    expect(vpn.status).toBe('ready');
    const act = await t.app.inject({
      method: 'POST',
      url: `/api/guideline-versions/${vpn.id}/activate`,
      headers: auth,
    });
    expect(act.statusCode).toBe(200);
    expect(act.json<VersionBody>().version.isActive).toBe(true);
    const superseded = items.find((v) => v.filename === 'a.txt')!;
    const bad = await t.app.inject({
      method: 'POST',
      url: `/api/guideline-versions/${superseded.id}/activate`,
      headers: auth,
    });
    expect(bad.statusCode).toBe(409);
  });

  it('marks a version failed when the embedder breaks and allows a retry', async () => {
    const spy = vi
      .spyOn(t.embedder, 'embedDocuments')
      .mockRejectedValue(new Error('quota exceeded'));
    const res = await upload('1. Topic C\nGuidance C.\n', 'c.txt');
    const id = res.json<VersionBody>().version.id;
    await expect(t.runJobs()).rejects.toThrow(/quota exceeded/);
    const failed = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${id}`,
      headers: auth,
    });
    expect(failed.json<VersionBody>().version).toMatchObject({
      status: 'failed',
      error: 'quota exceeded',
    });

    spy.mockRestore();
    const retry = await t.app.inject({
      method: 'POST',
      url: `/api/guideline-versions/${id}/retry`,
      headers: auth,
    });
    expect(retry.statusCode).toBe(200);
    expect(retry.json<VersionBody>().version.status).toBe('queued');
    await t.runJobs();
    const done = await t.app.inject({
      method: 'GET',
      url: `/api/guideline-versions/${id}`,
      headers: auth,
    });
    expect(done.json<VersionBody>().version).toMatchObject({
      status: 'ready',
      chunksTotal: 1,
      chunksEmbedded: 1,
    });
  });
});
