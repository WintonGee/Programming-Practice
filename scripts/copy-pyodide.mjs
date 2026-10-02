// Copies the Pyodide runtime into public/ so it is self-hosted (no CDN dependency at runtime).
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = dirname(createRequire(import.meta.url).resolve('pyodide/package.json'))
const { version } = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'))
const dest = join(root, 'public/pyodide', version)
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

// Drop other versions so stale runtimes never ship.
rmSync(join(root, 'public/pyodide'), { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
for (const f of FILES) cpSync(join(src, f), join(dest, f))
console.log(`copied ${FILES.length} Pyodide ${version} files to public/pyodide/${version}`)
