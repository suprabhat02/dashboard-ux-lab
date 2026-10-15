import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Build-time view: every catalogue registered (client bundles load one).
    setupFiles: ['tests/unit/setup.ts'],
  },
});
