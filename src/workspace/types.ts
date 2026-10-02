import type { FileRun, TestRun } from '../types'

export type RunKind = 'tests' | 'file'

export interface TestRunRecord {
  run: TestRun
  /** The unlocked stage when the run started; suites 1..stage ran. */
  stage: number
}

export interface FileRunRecord {
  run: FileRun
}

export type ResultsTab = 'tests' | 'output'
