import { loadConfig } from './config.js';

const minimal = {
  DATABASE_URL: 'postgres://x:y@localhost/db',
  JWT_SECRET: 'a-sufficiently-long-secret',
  GEMINI_API_KEY: 'key',
};

describe('loadConfig', () => {
  it('applies defaults', () => {
    const cfg = loadConfig(minimal);
    expect(cfg.PORT).toBe(3000);
    expect(cfg.RAG_TOP_K).toBe(4);
    expect(cfg.GEMINI_EMBEDDING_DIMENSIONS).toBe(768);
  });

  it('lists every missing variable in one error', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET[\s\S]*GEMINI_API_KEY/);
  });

  it('rejects out-of-range scores', () => {
    expect(() => loadConfig({ ...minimal, RAG_MIN_SCORE: '1.5' })).toThrow(/RAG_MIN_SCORE/);
  });
});
