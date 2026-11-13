import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Keep the dev client from crashing before React mounts.
  plugins: [react()],
  define: {
    __SERVER_FORWARD_CONSOLE__: JSON.stringify(false),
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        external: ['aria-query'],
      },
    },
  },
});
