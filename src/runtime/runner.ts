import type { FileRun, LoadError, TestResult, TestRun } from '../types'
import type { Suite, WorkerRequest, WorkerResponse } from './protocol'

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error'

/** Wall-clock budget for a single run once Python is booted. Infinite loops hit this. */
export const RUN_TIMEOUT_MS = 8000

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

type Pending = { resolve: (json: string) => void; reject: (err: Error) => void }

class TimeoutError extends Error {}

const failedRun = (err: unknown) =>
  err instanceof TimeoutError
    ? { kind: 'timeout' as const, ms: RUN_TIMEOUT_MS }
    : { kind: 'crash' as const, message: err instanceof Error ? err.message : String(err) }

/**
 * Owns the Pyodide web worker. Python runs off the main thread; a run that exceeds
 * RUN_TIMEOUT_MS terminates the worker and a fresh one boots for the next run.
 */
class PythonRuntime {
  private worker: Worker | null = null
  private booted: Promise<void> | null = null
  private pending = new Map<number, Pending>()
  private nextId = 1
  private queue: Promise<unknown> = Promise.resolve()
  private listeners = new Set<(s: RuntimeStatus) => void>()
  private _status: RuntimeStatus = 'idle'
  private _bootError: string | null = null

  get status(): RuntimeStatus {
    return this._status
  }

  get bootError(): string | null {
    return this._bootError
  }

  subscribe(listener: (s: RuntimeStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private setStatus(status: RuntimeStatus) {
    this._status = status
    for (const l of this.listeners) l(status)
  }

  /** Start booting Python. Safe to call repeatedly. */
  warmUp(): Promise<void> {
    if (this.booted) return this.booted
    this.setStatus('loading')
    this._bootError = null
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.booted = new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data
        if (msg.type === 'ready') {
          this.setStatus('ready')
          resolve()
        } else if (msg.type === 'boot-error') {
          this._bootError = msg.message
          this.setStatus('error')
          this.reset()
          reject(new Error(msg.message))
        } else {
          const p = this.pending.get(msg.id)
          if (!p) return
          this.pending.delete(msg.id)
          if (msg.type === 'result') p.resolve(msg.json)
          else p.reject(new Error(msg.message))
        }
      }
      worker.onerror = (event) => {
        this._bootError = event.message || 'Python worker failed to start'
        this.setStatus('error')
        this.reset()
        reject(new Error(this._bootError))
      }
    })
    return this.booted
  }

  private reset() {
    this.worker?.terminate()
    this.worker = null
    this.booted = null
    for (const p of this.pending.values()) p.reject(new Error('Python worker restarted'))
    this.pending.clear()
  }

  /**
   * Runs are serialized: the worker is shared by every view, and a queued run must not have
   * its timeout ticking (or be rejected by a restart) while an earlier run is still going.
   */
  private send(request: WithoutId<WorkerRequest>): Promise<string> {
    const run = this.queue.then(() => this.execute(request))
    this.queue = run.catch(() => {})
    return run
  }

  private async execute(request: WithoutId<WorkerRequest>): Promise<string> {
    await this.warmUp()
    const worker = this.worker
    if (!worker) throw new Error('Python worker unavailable')
    const id = this.nextId++
    this.setStatus('running')
    try {
      return await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id)
          reject(new TimeoutError())
        }, RUN_TIMEOUT_MS)
        this.pending.set(id, {
          resolve: (json) => {
            clearTimeout(timer)
            resolve(json)
          },
          reject: (err) => {
            clearTimeout(timer)
            reject(err)
          },
        })
        worker.postMessage({ ...request, id } as WorkerRequest)
      })
    } catch (err) {
      if (err instanceof TimeoutError) {
        // The worker is stuck in Python; the only way out is to kill it.
        this.reset()
        this.setStatus('idle')
        void this.warmUp().catch(() => {})
      }
      throw err
    } finally {
      if (this._status === 'running') this.setStatus('ready')
    }
  }

  async runTests(code: string, suites: Suite[]): Promise<TestRun> {
    const start = performance.now()
    try {
      const json = await this.send({ type: 'run-tests', code, suites })
      const parsed = JSON.parse(json) as { loadError: LoadError | null; results: TestResult[] }
      return { kind: 'ok', ...parsed, ms: performance.now() - start }
    } catch (err) {
      return failedRun(err)
    }
  }

  async runFile(code: string): Promise<FileRun> {
    try {
      const json = await this.send({ type: 'run-file', code })
      const parsed = JSON.parse(json) as { stdout: string; error: LoadError | null; ms: number }
      return { kind: 'ok', ...parsed }
    } catch (err) {
      return failedRun(err)
    }
  }
}

export const python = new PythonRuntime()
