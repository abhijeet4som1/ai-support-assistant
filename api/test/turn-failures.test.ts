/**
 * A provider failure at any point after the agent's message is stored must produce a failed
 * assistant turn (201, status "failed", reason kept), never a 500 that leaves the message without
 * an answer; and retrying the same message must reuse it instead of storing a duplicate.
 */
import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';

interface Msg {
  id: string;
  role: string;
  content: string;
  status: string;
  error?: string;
}
interface SendBody {
  userMessage: Msg;
  assistantMessage: Msg;
}

describe('provider failures inside a turn', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let conversationId: string;

  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
    const companyId = (
      await t.app.inject({
        method: 'POST',
        url: '/api/companies',
        headers: auth,
        payload: { name: 'Bookshop' },
      })
    ).json<{ company: { id: string } }>().company.id;
    await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: { ...auth, 'content-type': 'application/octet-stream', 'x-filename': 'b.txt' },
      payload: await readFile(
        new URL('../seed/guidelines/bookshop_support_guidelines.txt', import.meta.url),
      ),
    });
    await t.runJobs();
    conversationId = (
      await t.app.inject({
        method: 'POST',
        url: '/api/conversations',
        headers: auth,
        payload: { companyId },
      })
    ).json<{ conversation: { summary: { id: string } } }>().conversation.summary.id;
  });
  afterAll(() => t.close());

  const send = (content: string) =>
    t.app.inject({
      method: 'POST',
      url: `/api/conversations/${conversationId}/messages`,
      headers: auth,
      payload: { kind: 'customer', content },
    });

  it('stores a failed turn when embedding the message fails, and the retry reuses the message', async () => {
    const failing = vi
      .spyOn(t.embedder, 'embedQuery')
      .mockRejectedValue(new Error('embedding service unavailable'));
    try {
      const res = await send('Where is my order? It is two weeks late.');
      expect(res.statusCode).toBe(201);
      const { userMessage, assistantMessage } = res.json<SendBody>();
      expect(userMessage).toMatchObject({ role: 'customer', status: 'ok' });
      expect(assistantMessage).toMatchObject({ role: 'assistant', status: 'failed' });
      expect(assistantMessage.error).toContain('embedding service unavailable');
    } finally {
      failing.mockRestore();
    }

    const retry = await send('Where is my order? It is two weeks late.');
    expect(retry.statusCode).toBe(201);
    expect(retry.json<SendBody>().assistantMessage.status).toBe('ok');

    const thread = (
      await t.app.inject({
        method: 'GET',
        url: `/api/conversations/${conversationId}`,
        headers: auth,
      })
    ).json<{ conversation: { messages: Msg[] } }>().conversation.messages;
    expect(thread.map((m) => [m.role, m.status])).toEqual([
      ['customer', 'ok'],
      ['assistant', 'ok'],
    ]);
  });
});
