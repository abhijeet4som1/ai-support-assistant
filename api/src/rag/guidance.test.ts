import { finalizeGuidance, looksLikeCode } from './guidance.js';
import { type RetrievedChunk } from './retrieval.js';

const chunk = (id: string, title: string): RetrievedChunk => ({
  chunkId: id,
  ordinal: 0,
  title,
  content: '',
  score: 0.8,
});
const sections = [
  { id: 'S1', chunk: chunk('c1', 'Shipping Issues') },
  { id: 'S2', chunk: chunk('c2', 'Returns') },
];
const ok = {
  coverage: 'covered',
  recommendedReply: 'Hello [Name]',
  handlingSteps: ['a'],
  agentDecisions: [],
  escalation: { recommended: false, to: null, reason: null },
  citations: ['S1', 'S9', 'S1'],
  notes: null,
};

describe('finalizeGuidance', () => {
  it('maps citations to chunks, dropping unknown and duplicate ids', () => {
    const g = finalizeGuidance(JSON.stringify(ok), sections);
    expect(g.citations).toEqual([{ chunkId: 'c1', title: 'Shipping Issues' }]);
    expect(g.coverage).toBe('covered');
  });

  it('forces not_covered with escalation when nothing was retrieved', () => {
    const g = finalizeGuidance(JSON.stringify(ok), []);
    expect(g.coverage).toBe('not_covered');
    expect(g.escalation?.recommended).toBe(true);
    expect(g.citations).toEqual([]);
    expect(g.notes).toMatch(/No relevant guideline section/);
  });

  it('tolerates code fences and missing optional fields', () => {
    const g = finalizeGuidance(
      '```json\n{"coverage":"partial","recommendedReply":"x"}\n```',
      sections,
    );
    expect(g).toMatchObject({
      coverage: 'partial',
      recommendedReply: 'x',
      handlingSteps: [],
      citations: [],
    });
  });

  it('rejects invalid JSON', () => {
    expect(() => finalizeGuidance('not json', sections)).toThrow(/invalid JSON/);
  });
});

describe('code guard', () => {
  it('detects source code but not normal support prose', () => {
    expect(looksLikeCode('```python\nprint(1)\n```')).toBe(true);
    expect(looksLikeCode('def fib(n):\n  return n')).toBe(true);
    expect(looksLikeCode('Hello [Name], your refund has been issued. Please allow 5 days.')).toBe(
      false,
    );
  });
  it('downgrades a reply that contains code to not_covered with escalation', () => {
    const g = finalizeGuidance(
      JSON.stringify({ ...ok, recommendedReply: 'Sure! ```python\ndef fib(n): return n\n```' }),
      sections,
    );
    expect(g.coverage).toBe('not_covered');
    expect(g.escalation?.recommended).toBe(true);
    expect(g.notes).toMatch(/contained code/);
  });
});
