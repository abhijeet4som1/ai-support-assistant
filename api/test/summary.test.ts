import { readFile } from 'node:fs/promises';

import { eq } from 'drizzle-orm';

import { createTestApp } from './helpers/test-app.js';
import { schema } from '../src/db/client.js';

/** Long conversations: turns that leave the history window are folded into a rolling summary. */
describe('rolling conversation summary', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let conversationId: string;

  beforeAll(async () => {
    t = await createTestApp({ CHAT_HISTORY_WINDOW: 2 });
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

  it('does not summarise while the history fits the window', async () => {
    expect((await send('My order 1001 arrived damaged.')).statusCode).toBe(201);
    expect((await send('It was a hardcover, the corner is crushed.')).statusCode).toBe(201);
    expect(t.chatModel.summaries).toHaveLength(0);
  });

  it('folds turns that left the window into a summary and keeps it in the prompt', async () => {
    expect((await send('Can I get a replacement instead of a refund?')).statusCode).toBe(201);
    expect(t.chatModel.summaries).toHaveLength(1);
    const call = t.chatModel.calls.at(-1)!;
    expect(call.turns[0]!.text).toContain('<conversation_summary>');
    expect(call.turns[0]!.text).toContain(t.chatModel.summaries[0]);
    // summary, ack, then the two-message window, then the latest message
    expect(call.turns.map((x) => x.role)).toEqual(['user', 'model', 'user', 'model', 'user']);
    const row = await t.db.query.conversations.findFirst({
      where: eq(schema.conversations.id, conversationId),
    });
    expect(row?.historySummary).toBe(t.chatModel.summaries[0]);
    expect(row?.historySummaryUpto).toBeTruthy();
    const trace = t.tracer.turns.at(-1)!;
    expect(trace.summary?.messages).toBe(2);
    expect(trace.summary?.output).toBe(t.chatModel.summaries[0]);
  });

  it('extends the existing summary instead of re-summarising everything', async () => {
    expect((await send('Great, how long will the replacement take?')).statusCode).toBe(201);
    expect(t.chatModel.summaries).toHaveLength(2);
    expect(t.tracer.turns.at(-1)!.summary?.input).toContain('Previous summary:');
    expect(t.tracer.turns.at(-1)!.summary?.messages).toBe(2);
  });

  it('keeps answering when the summariser fails and retries next turn', async () => {
    const original = t.chatModel.summarize.bind(t.chatModel);
    t.chatModel.summarize = () => Promise.reject(new Error('summary down'));
    const res = await send('Any update?');
    expect(res.statusCode).toBe(201);
    expect(res.json<{ assistantMessage: { status: string } }>().assistantMessage.status).toBe('ok');
    expect(t.tracer.turns.at(-1)!.summary?.error).toBe('summary failed');
    t.chatModel.summarize = original;
    await send('Thanks.');
    // the messages skipped during the failure are folded in now (2 skipped + 2 new)
    expect(t.tracer.turns.at(-1)!.summary?.messages).toBe(4);
  });
});
