import { readFile } from 'node:fs/promises';

import { createTestApp } from './helpers/test-app.js';

interface Msg {
  id: string;
  role: string;
  content: string;
  status: string;
  error?: string;
  coverage?: string;
  guidance?: {
    coverage: string;
    recommendedReply: string;
    citations: { chunkId: string; title?: string }[];
    escalation: { recommended: boolean };
  };
  retrieval?: { chunkId: string; title?: string; score: number }[];
}
interface SendBody {
  userMessage: Msg;
  assistantMessage: Msg;
}
interface ConvBody {
  conversation: {
    summary: {
      id: string;
      title: string;
      messageCount: number;
      lastCoverage?: string;
      companyName: string;
    };
    messages: Msg[];
  };
}

describe('conversations + RAG', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { authorization: string };
  let auth2: { authorization: string };
  let bookshopId: string;
  let emptyCompanyId: string;
  let conversationId: string;

  const post = (url: string, payload: object, headers = auth) =>
    t.app.inject({ method: 'POST', url, headers, payload });
  const get = (url: string, headers = auth) => t.app.inject({ method: 'GET', url, headers });

  beforeAll(async () => {
    t = await createTestApp();
    auth = { authorization: `Bearer ${await t.login()}` };
    auth2 = { authorization: `Bearer ${await t.login('agent2', 'agent2pass')}` };
    bookshopId = (await post('/api/companies', { name: 'Bookshop' })).json<{
      company: { id: string };
    }>().company.id;
    emptyCompanyId = (await post('/api/companies', { name: 'Empty Co' })).json<{
      company: { id: string };
    }>().company.id;
    await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${bookshopId}/guidelines`,
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
  });
  afterAll(() => t.close());

  it('refuses to start a chat for a company without processed guidelines', async () => {
    const res = await post('/api/conversations', { companyId: emptyCompanyId });
    expect(res.statusCode).toBe(409);
    expect(res.headers['x-amzn-errortype']).toBe('GuidelinesNotReadyError');
  });

  it('creates a conversation', async () => {
    const res = await post('/api/conversations', { companyId: bookshopId });
    expect(res.statusCode).toBe(201);
    const body = res.json<ConvBody>();
    expect(body.conversation.summary).toMatchObject({ companyName: 'Bookshop', messageCount: 0 });
    conversationId = body.conversation.summary.id;
  });

  it('answers a covered question with grounded, cited guidance', async () => {
    const res = await post(`/api/conversations/${conversationId}/messages`, {
      kind: 'customer',
      content:
        'Hi, my order was supposed to arrive last week and the shipping tracking has not updated. Where is my package?',
    });
    expect(res.statusCode).toBe(201);
    const { userMessage, assistantMessage } = res.json<SendBody>();
    expect(userMessage).toMatchObject({ role: 'customer', status: 'ok' });
    expect(assistantMessage.status).toBe('ok');
    expect(assistantMessage.guidance?.coverage).toBe('covered');
    expect(assistantMessage.retrieval?.[0]?.title).toBe('Shipping Issues');
    expect(assistantMessage.guidance?.citations[0]?.title).toBe('Shipping Issues');
    expect(assistantMessage.guidance?.recommendedReply).toContain('[Name]');
    // The model received the section text and the customer message.
    const lastTurn = t.chatModel.calls.at(-1)!.turns.at(-1)!.text;
    expect(lastTurn).toContain('[S1] Shipping Issues');
    expect(lastTurn).toContain('Where is my package?');

    // The turn was traced: retrieval + generation with usage and context-window share.
    const trace = t.tracer.turns.at(-1)!;
    expect(trace.meta).toMatchObject({ conversationId, kind: 'customer', companyName: 'Bookshop' });
    expect(trace.retrieval?.[1].sections[0]?.title).toBe('Shipping Issues');
    expect(trace.generation).toMatchObject({
      model: 'fake-chat',
      promptTokens: 100,
      completionTokens: 50,
      thinkingTokens: 20,
      totalTokens: 170,
      droppedHistoryTurns: 0,
    });
    expect(trace.generation?.contextUsedPct).toBeGreaterThan(0);
    expect(trace.generation?.contextUsedPct).toBeLessThan(1);
    expect(trace.generation?.turns.at(-1)?.text).toContain('<customer_message>');
    expect(trace.end).toMatchObject({
      status: 'ok',
      coverage: 'covered',
      messageId: assistantMessage.id,
    });
  });

  it('carries context into follow-ups and revises on agent instructions', async () => {
    const res = await post(`/api/conversations/${conversationId}/messages`, {
      kind: 'instruction',
      content: 'Make it shorter and more formal.',
    });
    expect(res.statusCode).toBe(201);
    const { assistantMessage } = res.json<SendBody>();
    expect(assistantMessage.guidance?.recommendedReply).toContain('(revised)');
    const call = t.chatModel.calls.at(-1)!;
    // history: customer, compacted assistant turn, then latest instruction turn
    expect(call.turns.map((x) => x.role)).toEqual(['user', 'model', 'user']);
    expect(call.turns[1]!.text).toMatch(/^coverage: covered\nrecommendedReply: /);
    expect(call.turns[2]!.text).toContain('<agent_instruction>');
  });

  it('reports not_covered with escalation when the guidelines do not cover the topic', async () => {
    // Fresh conversation: follow-ups reuse the previous customer message for retrieval.
    const fresh = (await post('/api/conversations', { companyId: bookshopId })).json<ConvBody>()
      .conversation.summary.id;
    const res = await post(`/api/conversations/${fresh}/messages`, {
      kind: 'customer',
      content: 'Zxqv blorptastic quux fnord wibble?',
    });
    const { assistantMessage } = res.json<SendBody>();
    expect(assistantMessage.guidance?.coverage).toBe('not_covered');
    expect(assistantMessage.guidance?.escalation.recommended).toBe(true);
    expect(assistantMessage.retrieval).toEqual([]);
  });

  it('persists a failed assistant turn and lets the same message be retried without duplicating it', async () => {
    t.chatModel.failNext = new Error('quota exceeded');
    const failed = await post(`/api/conversations/${conversationId}/messages`, {
      kind: 'customer',
      content: 'Can I return a damaged book?',
    });
    expect(failed.statusCode).toBe(201);
    expect(failed.json<SendBody>().assistantMessage).toMatchObject({ status: 'failed' });
    expect(t.tracer.turns.at(-1)?.generation?.error).toBe('quota exceeded');
    expect(t.tracer.turns.at(-1)?.end?.status).toBe('failed');
    const before = (await get(`/api/conversations/${conversationId}`)).json<ConvBody>().conversation
      .messages.length;

    const retried = await post(`/api/conversations/${conversationId}/messages`, {
      kind: 'customer',
      content: 'Can I return a damaged book?',
    });
    const body = retried.json<SendBody>();
    expect(body.assistantMessage.status).toBe('ok');
    expect(
      body.assistantMessage.retrieval?.some((r) => /Damaged|Returns/.test(r.title ?? '')),
    ).toBe(true);
    const after = (await get(`/api/conversations/${conversationId}`)).json<ConvBody>().conversation
      .messages;
    expect(after.length).toBe(before); // failed turn replaced, user message reused
    expect(after.filter((m) => m.content === 'Can I return a damaged book?')).toHaveLength(1);
  });

  it('returns the full conversation with a title from the first customer message', async () => {
    const res = await get(`/api/conversations/${conversationId}`);
    const { summary, messages } = res.json<ConvBody>().conversation;
    expect(summary.title).toMatch(/^Hi, my order was supposed/);
    expect(summary.messageCount).toBe(messages.length);
    expect(messages[0]!.role).toBe('customer');
    expect(messages[1]!.role).toBe('assistant');
  });

  it('keeps conversations private to the agent who started them', async () => {
    const theirs = (
      await post('/api/conversations', { companyId: bookshopId }, auth2)
    ).json<ConvBody>().conversation.summary.id;
    await post(
      `/api/conversations/${theirs}/messages`,
      { kind: 'customer', content: 'Payment failed twice, what now?' },
      auth2,
    );

    // agent2 sees only its own thread; agent1's list never contains it.
    const agent2List = await get('/api/conversations', auth2);
    expect(agent2List.json<{ items: { id: string }[] }>().items.map((c) => c.id)).toEqual([theirs]);
    const agent1List = await get('/api/conversations');
    const agent1Ids = agent1List.json<{ items: { id: string }[] }>().items.map((c) => c.id);
    expect(agent1Ids).toContain(conversationId);
    expect(agent1Ids).not.toContain(theirs);

    // Reading, continuing or rating another agent's thread answers 404 (existence not revealed).
    expect((await get(`/api/conversations/${theirs}`)).statusCode).toBe(404);
    expect(
      (await post(`/api/conversations/${theirs}/messages`, { kind: 'customer', content: 'hi' }))
        .statusCode,
    ).toBe(404);
    const theirAnswer = (await get(`/api/conversations/${theirs}`, auth2)).json<ConvBody>()
      .conversation.messages[1]!;
    const rate = await t.app.inject({
      method: 'PUT',
      url: `/api/messages/${theirAnswer.id}/feedback`,
      headers: auth,
      payload: { rating: 'up' },
    });
    expect(rate.statusCode).toBe(404);

    // Company conversation counts are per agent as well.
    const company = (await get(`/api/companies/${bookshopId}`, auth2)).json<{
      company: { conversationCount: number };
    }>().company;
    expect(company.conversationCount).toBe(1);
  });

  it("filters by coverage and paginates with a cursor within the agent's own conversations", async () => {
    const third = (await post('/api/conversations', { companyId: bookshopId })).json<ConvBody>()
      .conversation.summary.id;
    await post(`/api/conversations/${third}/messages`, {
      kind: 'customer',
      content: 'Payment failed twice, what now?',
    });

    const all = await get('/api/conversations');
    const allIds = all.json<{ items: { id: string }[] }>().items.map((c) => c.id);
    expect(allIds[0]).toBe(third); // most recent activity first
    expect(allIds).toHaveLength(3);

    const covered = await get('/api/conversations?coverage=covered');
    expect(covered.json<{ items: { id: string }[] }>().items.map((c) => c.id)).toContain(third);

    const page1 = await get('/api/conversations?limit=2');
    const p1 = page1.json<{ items: { id: string }[]; nextCursor?: string }>();
    expect(p1.items).toHaveLength(2);
    expect(p1.nextCursor).toBeDefined();
    const page2 = await get(
      `/api/conversations?limit=2&cursor=${encodeURIComponent(p1.nextCursor!)}`,
    );
    const p2 = page2.json<{ items: { id: string }[]; nextCursor?: string }>();
    expect(p2.items).toHaveLength(1);
    expect([...p1.items, ...p2.items].map((c) => c.id).sort()).toEqual([...allIds].sort());
    expect(p2.nextCursor).toBeUndefined();
  });

  it('404s for unknown conversations', async () => {
    const res = await get('/api/conversations/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toBe(404);
  });
});
