import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression(),
    // Bundle analyzer — opt-in only (`ANALYZE=true npm run build`). Off by default so
    // regular/CI builds stay fast and don't emit the (gitignored) tmp/stats.html report.
    ...(process.env.ANALYZE
      ? [visualizer({ filename: './tmp/stats.html', open: false, gzipSize: true, brotliSize: true })]
      : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/three/')) {
              return 'vendor-three';
            }
            if (id.includes('/src/admin/')) {
              return 'chunk-admin';
            }
            if (
              id.includes('node_modules/@react-three/') ||
              id.includes('node_modules/r3f-perf/') ||
              id.includes('node_modules/@react-spring/')
            ) {
              return 'vendor-r3f';
            }
            if (id.includes('node_modules/gsap/')) {
              return 'vendor-gsap';
            }
            if (id.includes('node_modules/posthog-js/')) {
              return 'vendor-posthog';
            }
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  server: {
    host: true, // bind 0.0.0.0 → accessible depuis les appareils du même Wi-Fi (URL "Network")
  },
  test: {
    // Pure logic by default; DOM tests opt in via a leading `// @vitest-environment jsdom` docblock.
    environment: 'node',
    globals: true, // required for React Testing Library's auto-cleanup
    setupFiles: ['./src/test/setup.js'],
  },
})
