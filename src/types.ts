export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Stage {
  /** 1-based stage number. */
  number: number
  title: string
  /** Markdown. */
  prompt: string
  hints: string[]
  /** Python test source for this stage only. */
  tests: string
  /** Reference solution that passes stages 1..number. */
  solution: string
}

export interface Problem {
  slug: string
  title: string
  difficulty: Difficulty
  order: number
  tags: string[]
  summary: string
  estimatedMinutes: number
  starter: string
  stages: Stage[]
}

export type TestStatus = 'pass' | 'fail' | 'error'

export interface TraceFrame {
  file: string
  line: number
  function: string
  code: string
}

export interface TestResult {
  stage: number
  name: string
  /** First line of the test's docstring. */
  doc: string
  status: TestStatus
  message: string
  /** Line in the stage's tests.py that failed, when known. */
  line: number | null
  code: string
  frames: TraceFrame[]
  stdout: string
  ms: number
}

export interface LoadError {
  message: string
  line?: number | null
  column?: number | null
  code?: string
  frames?: TraceFrame[]
}

export type TestRun =
  | { kind: 'ok'; loadError: LoadError | null; results: TestResult[]; ms: number }
  | { kind: 'timeout'; ms: number }
  | { kind: 'crash'; message: string }

export type FileRun =
  | { kind: 'ok'; stdout: string; error: LoadError | null; ms: number }
  | { kind: 'timeout'; ms: number }
  | { kind: 'crash'; message: string }
