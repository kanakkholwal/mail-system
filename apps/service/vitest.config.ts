import { defineConfig } from 'vitest/config';

/**
 * No source aliases. The service resolves the workspace packages through their
 * exports map, so tests exercise the same artefact a published consumer gets.
 */
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
