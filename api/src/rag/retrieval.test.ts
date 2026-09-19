import { mergeRetrieved, type RetrievedChunk } from './retrieval.js';

const chunk = (chunkId: string, score: number): RetrievedChunk => ({
  chunkId,
  ordinal: 0,
  title: chunkId,
  content: '',
  score,
});

describe('mergeRetrieved (correction-anchored retrieval)', () => {
  it('appends sections found through the correction that the live query missed, tagged via', () => {
    const merged = mergeRetrieved(
      [chunk('connection', 0.64), chunk('outages', 0.62)],
      [chunk('billing', 0.61), chunk('connection', 0.6), chunk('devices', 0.56)],
      2,
    );
    expect(merged.map((c) => c.chunkId)).toEqual(['connection', 'outages', 'billing', 'devices']);
    expect(merged.map((c) => c.via)).toEqual([undefined, undefined, 'correction', 'correction']);
  });

  it('respects the extra cap and keeps the primary order untouched', () => {
    const merged = mergeRetrieved([chunk('a', 0.7)], [chunk('b', 0.6), chunk('c', 0.6)], 1);
    expect(merged.map((c) => c.chunkId)).toEqual(['a', 'b']);
  });

  it('adds nothing when the correction retrieves the same sections', () => {
    expect(mergeRetrieved([chunk('a', 0.7)], [chunk('a', 0.7)], 2)).toHaveLength(1);
  });
});
