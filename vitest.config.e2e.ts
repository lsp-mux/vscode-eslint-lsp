import { defineConfig } from 'vitest/config';

const testTimeout = 120_000;

export default defineConfig({
  test: {
    include: ['e2e/**/*.test.ts'],
    testTimeout,
  },
});
