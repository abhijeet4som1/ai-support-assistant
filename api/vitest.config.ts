import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // PGlite boot + migrations can take a few seconds when the workspace runs tests in parallel.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
