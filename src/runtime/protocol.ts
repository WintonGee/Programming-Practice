export interface Suite {
  stage: number
  source: string
}

export type WorkerRequest =
  | { type: 'run-tests'; id: number; code: string; suites: Suite[] }
  | { type: 'run-file'; id: number; code: string }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'boot-error'; message: string }
  | { type: 'result'; id: number; json: string }
  | { type: 'error'; id: number; message: string }
