import { GoogleGenAI } from '@google/genai';
import { type Logger } from 'pino';

import { errorStatus } from '../lib/unknown.js';

export interface Embedder {
  readonly model: string;
  readonly dimensions: number;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/** batchEmbedContents accepts up to 100 requests per call. */
const BATCH = 100;

export function createGeminiEmbedder(opts: {
  apiKey: string;
  model: string;
  dimensions: number;
  /** Per-request timeout; a hung call fails (and is retried like a 503) instead of hanging. */
  timeoutMs?: number;
  log: Logger;
}): Embedder {
  const ai = new GoogleGenAI({
    apiKey: opts.apiKey,
    ...(opts.timeoutMs ? { httpOptions: { timeout: opts.timeoutMs } } : {}),
  });

  async function embed(
    texts: string[],
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY',
  ): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const batch = texts.slice(i, i + BATCH);
      const res = await withRetry(
        () =>
          ai.models.embedContent({
            model: opts.model,
            // One Content per text. Passing plain strings makes the SDK merge the batch into a
            // single multi-part content, which gemini-embedding-2 embeds as ONE document (one
            // vector for the whole batch); explicit contents give one vector per text.
            contents: batch.map((text) => ({ role: 'user', parts: [{ text }] })),
            config: { taskType, outputDimensionality: opts.dimensions },
          }),
        opts.log,
      );
      const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
      if (vectors.length !== batch.length) {
        throw new Error(`embedding count mismatch: ${vectors.length} != ${batch.length}`);
      }
      for (const v of vectors) out.push(normalize(v));
    }
    return out;
  }

  return {
    model: opts.model,
    dimensions: opts.dimensions,
    embedDocuments: (texts) => embed(texts, 'RETRIEVAL_DOCUMENT'),
    embedQuery: async (text) => (await embed([text], 'RETRIEVAL_QUERY'))[0]!,
  };
}

/** Unit-length vectors so cosine distance == 1 - dot product and thresholds are stable. */
export function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

async function withRetry<T>(fn: () => Promise<T>, log: Logger, attempts = 4): Promise<T> {
  let delay = 1000;
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = errorStatus(err);
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || i >= attempts) throw err;
      log.warn({ status, attempt: i }, 'embedding call throttled; retrying');
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

/**
 * Deterministic fake embedder for tests: hashed bag-of-words into `dimensions`, normalised.
 * Similar texts share tokens and therefore direction, so similarity search behaves sensibly.
 */
export function createFakeEmbedder(dimensions = 768): Embedder {
  const vec = (text: string) => {
    const v = new Array<number>(dimensions).fill(0);
    for (const word of text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []) {
      let h = 2166136261;
      for (const ch of word) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
      const idx = h % dimensions;
      v[idx] = (v[idx] ?? 0) + 1;
    }
    return normalize(v);
  };
  return {
    model: 'fake',
    dimensions,
    embedDocuments: (texts) => Promise.resolve(texts.map(vec)),
    embedQuery: (text) => Promise.resolve(vec(text)),
  };
}
