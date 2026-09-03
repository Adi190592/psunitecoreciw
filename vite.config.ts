import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The SPA builds to ./dist, which the Worker serves as static assets
// (see wrangler.jsonc → assets.directory).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
