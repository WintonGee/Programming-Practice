/// <reference lib="webworker" />
import type { PyodideAPI } from 'pyodide'
import harnessSource from './python/harness.py?raw'
import runnerSource from './python/runner.py?raw'
import type { WorkerRequest, WorkerResponse } from './protocol'

declare const self: DedicatedWorkerGlobalScope

const PYODIDE_BASE = `${import.meta.env.BASE_URL}pyodide/`

type PyFn = (...args: unknown[]) => string

async function boot(): Promise<{ runTests: PyFn; runFile: PyFn }> {
  const { loadPyodide } = (await import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`)) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideAPI>
  }
  const pyodide = await loadPyodide({ indexURL: PYODIDE_BASE })
  pyodide.FS.writeFile('/home/pyodide/harness.py', harnessSource)
  pyodide.FS.writeFile('/home/pyodide/runner.py', runnerSource)
  pyodide.runPython('import sys; sys.path.insert(0, "/home/pyodide")')
  return {
    runTests: pyodide.runPython('from runner import run_tests; run_tests') as PyFn,
    runFile: pyodide.runPython('from runner import run_file; run_file') as PyFn,
  }
}

const post = (message: WorkerResponse) => self.postMessage(message)

const ready = boot()
ready.then(
  () => post({ type: 'ready' }),
  (err: unknown) => post({ type: 'boot-error', message: String(err) }),
)

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  try {
    const py = await ready
    const json =
      request.type === 'run-tests'
        ? py.runTests(request.code, JSON.stringify(request.suites))
        : py.runFile(request.code)
    post({ type: 'result', id: request.id, json })
  } catch (err) {
    post({ type: 'error', id: request.id, message: String(err) })
  }
}
