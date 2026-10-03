import type { FileRun, TestResult, TestRun } from '../types'

export type RunKind = 'tests' | 'file'

export interface TestRunRecord {
  run: TestRun
  /** The unlocked stage when the run started; suites 1..stage ran. */
  stage: number
  /** The exact code that ran; line references are only valid while the editor still holds it. */
  code: string
}

export interface FileRunRecord {
  run: FileRun
  code: string
}

export type ResultsTab = 'tests' | 'output'

export const passCount = (results: TestResult[]) => results.filter((r) => r.status === 'pass').length

export const allTestsPassed = (run: TestRun) =>
  run.kind === 'ok' && !run.loadError && run.results.length > 0 && passCount(run.results) === run.results.length
