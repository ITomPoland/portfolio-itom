import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression()],
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
