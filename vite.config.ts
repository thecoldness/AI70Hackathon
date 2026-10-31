import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { journalMiddleware } from './server/journal';

/**
 * Serves POST /api/journal from the dev and preview servers.
 * ANTHROPIC_API_KEY is read from the shell or from .env.local — it has no VITE_ prefix,
 * so Vite never ships it to the browser.
 */
function journalApi(): Plugin {
  const hasCredentials = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  return {
    name: 'trace-journal-api',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, 'ANTHROPIC_');
      for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
    },
    configureServer(server) { server.middlewares.use(journalMiddleware(hasCredentials)); },
    configurePreviewServer(server) { server.middlewares.use(journalMiddleware(hasCredentials)); },
  };
}

export default defineConfig({ plugins: [react(), journalApi()] });
