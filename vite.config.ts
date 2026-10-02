/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  // The workspace chunk is mostly CodeMirror and is lazy-loaded; home stays smaller.
  build: { chunkSizeWarningLimit: 800 },
  optimizeDeps: { exclude: ['pyodide'] },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
