/**
 * Message paging on GET /api/conversations/{id}: the newest page first, older pages through
 * `before`, and the denormalised `lastCoverage` that backs the history coverage filter.
 */
import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';

interface Msg {
  id: string;
  role: string;
  content: string;
}
interface Page {
  conversation: { summary: { messageCount: number; lastCoverage?: string }; messages: Msg[] };
  olderCursor?: string;
}

describe('message paging', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let companyId: string;
  let conversationId: string;

  const get = (url: string) => t.app.inject({ method: 'GET', url, headers: auth });

  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
    const created = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: 'Bookshop' },
    });
    companyId = created.json<{ company: { id: string } }>().company.id;
    await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: { ...auth, 'content-type': 'application/octet-stream', 'x-filename': 'b.txt' },
      payload: await readFile(
        new URL('../seed/guidelines/bookshop_support_guidelines.txt', import.meta.url),
      ),
    });
    await t.runJobs();
    const conv = await t.app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: auth,
      payload: { companyId },
    });
    conversationId = conv.json<{ conversation: { summary: { id: string } } }>().conversation.summary
      .id;
    for (const content of ['Where is my order?', 'Can I get a refund instead?', 'Thanks a lot']) {
      const res = await t.app.inject({
        method: 'POST',
        url: `/api/conversations/${conversationId}/messages`,
        headers: auth,
        payload: { kind: 'customer', content },
      });
      expect(res.statusCode).toBe(201);
    }
  });
  afterAll(() => t.close());

  it('returns every message by default with no older cursor', async () => {
    const page = (await get(`/api/conversations/${conversationId}`)).json<Page>();
    expect(page.conversation.messages).toHaveLength(6);
    expect(page.conversation.summary.messageCount).toBe(6);
    expect(page.olderCursor).toBeUndefined();
    expect(page.conversation.messages.map((m) => m.role)).toEqual([
      'customer',
      'assistant',
      'customer',
      'assistant',
      'customer',
      'assistant',
    ]);
  });

  it('pages from the newest message backwards until the first one', async () => {
    const first = (await get(`/api/conversations/${conversationId}?limit=4`)).json<Page>();
    expect(first.conversation.messages).toHaveLength(4);
    expect(first.conversation.messages[0]?.content).toBe('Can I get a refund instead?');
    expect(first.conversation.messages.at(-2)?.content).toBe('Thanks a lot');
    expect(first.conversation.messages.at(-1)?.role).toBe('assistant');
    expect(first.olderCursor).toBeDefined();

    const older = (
      await get(`/api/conversations/${conversationId}?limit=4&before=${first.olderCursor}`)
    ).json<Page>();
    expect(older.conversation.messages.map((m) => m.content)).toEqual([
      'Where is my order?',
      expect.any(String),
    ]);
    expect(older.olderCursor).toBeUndefined();

    const seen = new Set(
      [...first.conversation.messages, ...older.conversation.messages].map((m) => m.id),
    );
    expect(seen.size).toBe(6);
  });

  it('rejects an invalid cursor gracefully by returning the newest page', async () => {
    const page = (
      await get(`/api/conversations/${conversationId}?limit=2&before=not-a-cursor`)
    ).json<Page>();
    expect(page.conversation.messages).toHaveLength(2);
    expect(page.olderCursor).toBeDefined();
  });

  it('keeps lastCoverage on the conversation and filters the list by it', async () => {
    const page = (await get(`/api/conversations/${conversationId}?limit=1`)).json<Page>();
    const coverage = page.conversation.summary.lastCoverage;
    expect(coverage).toBeDefined();
    const list = (
      await get(`/api/conversations?companyId=${companyId}&coverage=${coverage}`)
    ).json<{ items: { id: string }[] }>();
    expect(list.items.map((c) => c.id)).toContain(conversationId);
    const other = coverage === 'covered' ? 'not_covered' : 'covered';
    const none = (await get(`/api/conversations?companyId=${companyId}&coverage=${other}`)).json<{
      items: { id: string }[];
    }>();
    expect(none.items.map((c) => c.id)).not.toContain(conversationId);
  });
});
