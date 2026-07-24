import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // node:sqlite is a newer Node builtin that Vite's resolver doesn't yet
    // recognise; force it (and its bare alias) to stay external.
    server: {
      deps: {
        external: ['node:sqlite', 'sqlite'],
      },
    },
  },
  ssr: {
    external: ['node:sqlite'],
  },
});
