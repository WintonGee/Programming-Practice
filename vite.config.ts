/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const pyodideVersion = JSON.parse(readFileSync('node_modules/pyodide/package.json', 'utf8')).version as string

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pyodide is self-hosted under a versioned path so it can be cached as immutable.
  define: { __PYODIDE_VERSION__: JSON.stringify(pyodideVersion) },
  worker: { format: 'es' },
  // `pnpm dev:api` runs the Worker (the Teacher API) on 8787; the Vite dev server forwards /api to it.
  server: { proxy: { '/api': 'http://localhost:8787' } },
  // The workspace chunk is mostly CodeMirror and is lazy-loaded; home stays smaller.
  build: { chunkSizeWarningLimit: 800 },
  optimizeDeps: { exclude: ['pyodide'] },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'worker/**/*.test.ts'],
  },
})
