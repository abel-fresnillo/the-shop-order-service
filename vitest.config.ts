import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'api/index.ts',
        'vitest.config.ts',
        'drizzle.config.ts',
        'tests/**',
        'dist/**',
        'src/server.ts',
        'src/config.ts',
        'src/db/**',
        'src/instrumentation.ts',
        'src/observability/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
