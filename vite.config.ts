import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    watch: {
      // The local D1 database lives under .wrangler; its WAL/SHM files change on
      // every read, which would otherwise trigger constant full-page reloads in
      // dev. Keep Vite's default ignores and add the Wrangler state dir.
      ignored: ['**/node_modules/**', '**/.git/**', '**/.wrangler/**'],
    },
  },
})
