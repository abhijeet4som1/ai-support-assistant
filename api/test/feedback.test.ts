import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';

interface Msg {
  id: string;
  role: string;
  status: string;
  feedback?: { rating: string; user: { username: string } }[];
}
interface SendBody {
  userMessage: Msg;
  assistantMessage: Msg;
}
interface CorrectionBody {
  correction: {
    id: string;
    rating: string;
    queryText: string;
    correctedAnswer?: string;
    active: boolean;
    guidelineVersionId: string;
  };
}

describe('feedback / corrections', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let companyId: string;
  let conversationId: string;
  let assistantId: string;

  const post = (url: string, payload: object, headers = auth) =>
    t.app.inject({ method: 'POST', url, headers, payload });
  const put = (url: string, payload: object, headers = auth) =>
    t.app.inject({ method: 'PUT', url, headers, payload });
  const get = (url: string) => t.app.inject({ method: 'GET', url, headers: auth });

  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
    companyId = (await post('/api/companies', { name: 'Bookshop' })).json<{
      company: { id: string };
    }>().company.id;
    await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: {
        ...auth,
        'content-type': 'application/octet-stream',
        'x-filename': 'bookshop.txt',
      },
      payload: await readFile(
        new URL('../seed/guidelines/bookshop_support_guidelines.txt', import.meta.url),
      ),
    });
    await t.runJobs();
    conversationId = (await post('/api/conversations', { companyId })).json<{
      conversation: { summary: { id: string } };
    }>().conversation.summary.id;
    const sent = await post(`/api/conversations/${conversationId}/messages`, {
      kind: 'customer',
      content: 'My order arrived with the wrong book inside, what should I do?',
    });
    assistantId = sent.json<SendBody>().assistantMessage.id;
  });
  afterAll(() => t.close());

  it('requires a corrected answer for a thumbs down (field-level validation)', async () => {
    const res = await put(`/api/messages/${assistantId}/feedback`, {
      rating: 'down',
      whatWasWrong: 'Too vague',
    });
    expect(res.statusCode).toBe(400);
    expect(res.headers['x-amzn-errortype']).toBe('ValidationException');
    expect(res.json<{ fieldList: { path: string }[] }>().fieldList[0]?.path).toBe(
      '/correctedAnswer',
    );
  });

  it('stores a thumbs down with the originating customer message and guideline version', async () => {
    const res = await put(`/api/messages/${assistantId}/feedback`, {
      rating: 'down',
      whatWasWrong: 'Did not ask the customer to confirm the title received',
      correctedAnswer:
        'Hello [Name], I apologise for the mix-up. Could you confirm the title you received versus your order? I will ship the correct book today with a prepaid return label.',
    });
    expect(res.statusCode).toBe(200);
    const { correction } = res.json<CorrectionBody>();
    expect(correction).toMatchObject({ rating: 'down', active: true });
    expect(correction.queryText).toMatch(/wrong book/);
    expect(correction.guidelineVersionId).toBeTruthy();
    // The verdict is attached to the answer's trace as Langfuse scores.
    const traceId = t.tracer.turns.find((x) => x.end?.messageId === assistantId)?.traceId;
    expect(traceId).toBeTruthy();
    expect(t.tracer.scores).toEqual([
      expect.objectContaining({ traceId, name: 'agent-rating', value: 0, dataType: 'BOOLEAN' }),
      expect.objectContaining({ traceId, name: 'agent-correction', dataType: 'TEXT' }),
    ]);
  });

  it('is idempotent per user and message (re-rating updates instead of duplicating)', async () => {
    const res = await put(`/api/messages/${assistantId}/feedback`, { rating: 'up' });
    expect(res.statusCode).toBe(200);
    const list = await get(`/api/companies/${companyId}/corrections`);
    expect(list.json<{ items: unknown[] }>().items).toHaveLength(1);
    const conv = await get(`/api/conversations/${conversationId}`);
    const msg = conv
      .json<{ conversation: { messages: Msg[] } }>()
      .conversation.messages.find((m) => m.id === assistantId)!;
    expect(msg.feedback).toHaveLength(1);
    expect(msg.feedback?.[0]).toMatchObject({ rating: 'up', user: { username: 'agent1' } });
  });

  it('feeds similar corrections into later prompts as few-shot examples', async () => {
    await put(`/api/messages/${assistantId}/feedback`, {
      rating: 'down',
      whatWasWrong: 'Missing confirmation step',
      correctedAnswer: 'Ask the customer to confirm the received title first.',
    });
    const fresh = (await post('/api/conversations', { companyId })).json<{
      conversation: { summary: { id: string } };
    }>().conversation.summary.id;
    const res = await post(`/api/conversations/${fresh}/messages`, {
      kind: 'customer',
      content: 'I received the wrong book in my order, help!',
    });
    const assistant = res.json<
      SendBody & { assistantMessage: { correctionsUsed?: { correctionId: string }[] } }
    >().assistantMessage;
    expect(assistant.correctionsUsed?.length).toBe(1);
    // Correction-anchored retrieval ran: sections are unique and the trace carries the merged list.
    const traced = t.tracer.turns.at(-1)!.retrieval![1].sections;
    expect(new Set(traced.map((s) => s.chunkId)).size).toBe(traced.length);
    expect(traced.length).toBeGreaterThanOrEqual(1);
    const lastTurn = t.chatModel.calls.at(-1)!.turns.at(-1)!.text;
    expect(lastTurn).toContain('<corrections');
    expect(lastTurn).toContain(
      'Correct answer: Ask the customer to confirm the received title first.',
    );
  });

  it('refuses feedback on non-assistant or failed messages', async () => {
    const conv = await get(`/api/conversations/${conversationId}`);
    const customerMsg = conv
      .json<{ conversation: { messages: Msg[] } }>()
      .conversation.messages.find((m) => m.role === 'customer')!;
    const res = await put(`/api/messages/${customerMsg.id}/feedback`, { rating: 'up' });
    expect(res.statusCode).toBe(409);
  });

  it('deactivates corrections when the guidelines are replaced, and lets agents toggle them', async () => {
    await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: { ...auth, 'content-type': 'application/octet-stream', 'x-filename': 'v2.txt' },
      payload:
        '1. Wrong Product Delivered\nApologize and ship the correct item.\n\n2. Refunds\nRefund within 14 days.\n',
    });
    await t.runJobs();

    const active = await get(`/api/companies/${companyId}/corrections`);
    expect(active.json<{ items: unknown[] }>().items).toHaveLength(0);
    const all = await get(`/api/companies/${companyId}/corrections?includeInactive=true`);
    const items = all.json<{ items: { id: string; active: boolean }[] }>().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.active).toBe(false);

    const reactivated = await t.app.inject({
      method: 'PATCH',
      url: `/api/corrections/${items[0]!.id}`,
      headers: auth,
      payload: { active: true },
    });
    expect(reactivated.statusCode).toBe(200);
    expect(reactivated.json<CorrectionBody>().correction.active).toBe(true);
    const again = await get(`/api/companies/${companyId}/corrections`);
    expect(again.json<{ items: unknown[] }>().items).toHaveLength(1);
  });
});
