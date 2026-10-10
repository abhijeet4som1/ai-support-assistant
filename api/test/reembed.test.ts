/**
 * `reembedAll` on a real (PGlite) database: guidelines are ingested through the normal upload
 * path with the fake embedder, a correction is stored, then everything is re-embedded with a
 * different embedder and every stored vector must come from the new one.
 */
import { readFile } from 'node:fs/promises';

import { eq } from 'drizzle-orm';

import { createTestApp } from './helpers/test-app.js';
import { schema } from '../src/db/client.js';
import { reembedAll } from '../src/db/reembed.js';
import { seedGuidelinesDir } from '../src/db/seed.js';
import { createFakeEmbedder, type Embedder } from '../src/rag/embeddings.js';

/** The fake embedder with every vector negated: still unit length, never equal to the original. */
function createFlippedEmbedder(): Embedder {
  const base = createFakeEmbedder();
  const flip = (v: number[]) => v.map((x) => -x);
  return {
    model: 'fake-flipped',
    dimensions: base.dimensions,
    embedDocuments: async (texts) => (await base.embedDocuments(texts)).map(flip),
    embedQuery: async (text) => flip(await base.embedQuery(text)),
  };
}

describe('reembedAll', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let versionId: string;

  beforeAll(async () => {
    t = await createTestApp();
    const auth = { authorization: `Bearer ${await t.login()}` };
    const created = await t.app.inject({
      method: 'POST',
      url: '/api/companies',
      headers: auth,
      payload: { name: 'Bookshop' },
    });
    const companyId = created.json<{ company: { id: string } }>().company.id;
    const uploaded = await t.app.inject({
      method: 'PUT',
      url: `/api/companies/${companyId}/guidelines`,
      headers: {
        ...auth,
        'content-type': 'application/octet-stream',
        'x-filename': 'bookshop_support_guidelines.txt',
      },
      payload: await readFile(
        new URL('bookshop_support_guidelines.txt', `file://${seedGuidelinesDir}`),
      ),
    });
    versionId = uploaded.json<{ version: { id: string } }>().version.id;
    await t.runJobs();

    // One stored correction with a query vector from the original embedder.
    const conv = await t.app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: auth,
      payload: { companyId },
    });
    const conversationId = conv.json<{ conversation: { summary: { id: string } } }>().conversation
      .summary.id;
    const sent = await t.app.inject({
      method: 'POST',
      url: `/api/conversations/${conversationId}/messages`,
      headers: auth,
      payload: { kind: 'customer', content: 'The wrong book arrived, what do I do?' },
    });
    const assistantId = sent.json<{ assistantMessage: { id: string } }>().assistantMessage.id;
    const user = await t.db.query.users.findFirst();
    const queryText = 'The wrong book arrived, what do I do?';
    await t.db.insert(schema.feedback).values({
      messageId: assistantId,
      conversationId,
      companyId,
      userId: user!.id,
      rating: 'down',
      correctedAnswer: 'Apologise and send the right book.',
      queryText,
      queryEmbedding: await t.embedder.embedQuery(queryText),
      guidelineVersionId: versionId,
      active: true,
    });
  });
  afterAll(() => t.close());

  it('replaces every chunk and correction vector with the new embedder output', async () => {
    const before = await t.db
      .select({ id: schema.guidelineChunks.id, embedding: schema.guidelineChunks.embedding })
      .from(schema.guidelineChunks)
      .where(eq(schema.guidelineChunks.versionId, versionId));
    expect(before.length).toBeGreaterThan(1);
    expect(before.every((c) => c.embedding)).toBe(true);
    const feedbackBefore = await t.db.query.feedback.findFirst();

    const progress: string[] = [];
    const result = await reembedAll(t.db, createFlippedEmbedder(), {
      batchSize: 3,
      onProgress: (done, total, what) => progress.push(`${what} ${done}/${total}`),
    });

    expect(result).toEqual({ chunks: before.length, feedback: 1 });
    expect(progress.at(-1)).toBe('corrections 1/1');
    expect(progress).toContain(`chunks ${before.length}/${before.length}`);
    // Batches of 3 over N chunks report ceil(N / 3) times.
    expect(progress.filter((p) => p.startsWith('chunks')).length).toBe(
      Math.ceil(before.length / 3),
    );

    const after = await t.db
      .select({ id: schema.guidelineChunks.id, embedding: schema.guidelineChunks.embedding })
      .from(schema.guidelineChunks)
      .where(eq(schema.guidelineChunks.versionId, versionId));
    const byId = new Map(before.map((c) => [c.id, c.embedding!]));
    for (const chunk of after) {
      const old = byId.get(chunk.id)!;
      expect(chunk.embedding!.length).toBe(old.length);
      // Negated, element by element: the vector came from the new embedder for the same text.
      chunk.embedding!.forEach((x, i) => expect(x).toBeCloseTo(-old[i]!, 6));
    }

    const feedbackAfter = await t.db.query.feedback.findFirst();
    feedbackAfter!.queryEmbedding!.forEach((x, i) =>
      expect(x).toBeCloseTo(-feedbackBefore!.queryEmbedding![i]!, 6),
    );
  });

  it('is a no-op on an empty database', async () => {
    const empty = await createTestApp();
    try {
      expect(await reembedAll(empty.db, createFlippedEmbedder())).toEqual({
        chunks: 0,
        feedback: 0,
      });
    } finally {
      await empty.close();
    }
  });
});
