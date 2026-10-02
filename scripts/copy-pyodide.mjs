// Copies the Pyodide runtime into public/ so it is self-hosted (no CDN dependency at runtime).
import { cpSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = dirname(createRequire(import.meta.url).resolve('pyodide/package.json'))
const dest = join(root, 'public/pyodide')
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

mkdirSync(dest, { recursive: true })
for (const f of FILES) cpSync(join(src, f), join(dest, f))
console.log(`copied ${FILES.length} Pyodide files to public/pyodide`)
