import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression()],
  server: {
    host: true, // bind 0.0.0.0 → accessible depuis les appareils du même Wi-Fi (URL "Network")
  },
})
