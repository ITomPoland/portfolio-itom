import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';
import { Buffer } from 'node:buffer';
import { cwd } from 'node:process';
import { generateSeoHtml } from './seo-plugin.js';
import { onRequest as handlePortraitChatRequest } from './functions/api/portrait-chat.js';

const MAX_LOCAL_API_BODY_BYTES = 24000;

const createPortraitChatDevPlugin = (env) => ({
  name: 'portrait-chat-dev-api',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = new URL(request.url || '/', 'http://localhost').pathname;
      if (pathname !== '/api/portrait-chat') return next();

      const requestController = new AbortController();
      const handleRequestAborted = () => requestController.abort();
      const handleResponseClosed = () => {
        if (!response.writableEnded) requestController.abort();
      };
      request.once('aborted', handleRequestAborted);
      response.once('close', handleResponseClosed);

      try {
        const chunks = [];
        let totalBytes = 0;

        for await (const chunk of request) {
          totalBytes += chunk.length;
          if (totalBytes > MAX_LOCAL_API_BODY_BYTES) {
            response.statusCode = 413;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'no-store');
            response.end(JSON.stringify({
              code: 'PAYLOAD_TOO_LARGE',
              message: '这段对话太长了，请缩短后再发送。'
            }));
            return;
          }
          chunks.push(chunk);
        }

        const requestUrl = new URL('/api/portrait-chat', `http://${request.headers.host || 'localhost'}`);
        const webRequest = new Request(requestUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : Buffer.concat(chunks),
          signal: requestController.signal
        });
        const webResponse = await handlePortraitChatRequest({
          request: webRequest,
          env: {
            GEMINI_API_KEY: env.GEMINI_API_KEY,
            GEMINI_MODEL: env.GEMINI_MODEL
          }
        });

        response.statusCode = webResponse.status;
        webResponse.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await webResponse.arrayBuffer()));
      } catch (error) {
        if (response.destroyed) return;
        server.config.logger.error(`[portrait-chat] local middleware failed: ${error?.message || 'unknown error'}`);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({
          code: 'LOCAL_API_ERROR',
          message: '本地文字对话服务暂时不可用。'
        }));
      } finally {
        request.off('aborted', handleRequestAborted);
        response.off('close', handleResponseClosed);
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [
      createPortraitChatDevPlugin(env),
      react(),
      viteCompression(),
      generateSeoHtml()
    ],
    server: {
      proxy: {
        '/sanity-cdn': {
          target: 'https://cdn.sanity.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sanity-cdn/, '')
        }
      }
    }
  };
})
