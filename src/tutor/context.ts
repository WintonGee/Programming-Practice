import type { ProblemProgress } from '../state/progress'
import type { LoadError, Problem } from '../types'
import type { TestRunRecord } from '../workspace/types'
import { clip } from './client'
import { LIMITS, type LastRun, type ProblemContext, type TutorMode } from './protocol'

/** Per-field caps the Worker enforces on test results; longer values are rejected, so clip them here. */
const CAPS = { summary: 200, name: 200, doc: 500, message: 2_000, code: 500, loadError: 2_000, title: 200, earlierStages: 10 }

function describeLoadError(e: LoadError): string {
  const where = e.line ? ` (line ${e.line})` : ''
  return clip(`${e.message}${where}`, CAPS.loadError)
}

/** Summarize a test run for the teacher. Returns undefined for a run that belongs to another stage. */
export function summarizeRun(record: TestRunRecord | null, stage: number): LastRun | undefined {
  if (!record || record.stage !== stage) return undefined
  const { run } = record
  if (run.kind === 'timeout') return { summary: 'Timed out (possible infinite loop)', failures: [] }
  if (run.kind === 'crash') return { summary: clip(`Run failed: ${run.message}`, CAPS.summary), failures: [] }
  if (run.loadError) return { summary: 'Code didn’t load', failures: [], loadError: describeLoadError(run.loadError) }
  const passing = run.results.filter((r) => r.status === 'pass').length
  const failures = run.results
    .filter((r) => r.status !== 'pass')
    .slice(0, LIMITS.failures)
    .map((r) => ({
      stage: r.stage,
      name: clip(r.name, CAPS.name),
      doc: clip(r.doc, CAPS.doc),
      message: clip(r.message, CAPS.message),
      code: clip(r.code, CAPS.code),
    }))
  return { summary: `${passing} of ${run.results.length} passing`, failures }
}

export interface WorkspaceSnapshot {
  problem: Problem
  progress: ProblemProgress
  code: string
  testRun: TestRunRecord | null
}

/** What the teacher sees: the current unlocked stage, the live editor code and the latest test run. */
export function buildProblemContext({ problem, progress, code, testRun }: WorkspaceSnapshot): ProblemContext {
  const stage = problem.stages[progress.unlockedStage - 1]
  const lastRun = summarizeRun(testRun, stage.number)
  return {
    kind: 'problem',
    mode: progress.mode,
    problemTitle: clip(problem.title, CAPS.title),
    difficulty: problem.difficulty,
    stageNumber: stage.number,
    stageCount: problem.stages.length,
    stageTitle: clip(stage.title, CAPS.title),
    prompt: clip(stage.prompt, LIMITS.promptChars),
    earlierStages: problem.stages
      .slice(0, stage.number - 1)
      .slice(-CAPS.earlierStages)
      .map((s) => clip(s.title, CAPS.title)),
    code: clip(code, LIMITS.codeChars),
    ...(lastRun && { lastRun }),
  }
}

export type ChatScope = { kind: 'problem'; mode: TutorMode; hasFailures: boolean } | { kind: 'general' }

export interface EmptyState {
  intro: string
  suggestions: string[]
}

export function emptyState(scope: ChatScope): EmptyState {
  if (scope.kind === 'general') {
    return {
      intro: 'Ask about Python, data structures, or how to approach staged interviews.',
      suggestions: ['Explain Python dataclasses', 'How do I approach a staged interview?', 'When should I use a heap?'],
    }
  }
  if (scope.mode === 'interview') {
    return {
      intro:
        'In interview mode the teacher acts as your interviewer: it answers clarifying questions and reacts to your approach, but won’t write the code for you.',
      suggestions: ['Can you clarify the requirements?', 'Is my approach reasonable?'],
    }
  }
  return {
    intro: 'Ask about this stage, your code, or your test results. The teacher explains and guides you toward the answer.',
    suggestions: [
      'Explain this stage',
      ...(scope.hasFailures ? ['Why are my tests failing?'] : []),
      'Review my code',
      'Give me a small hint',
    ],
  }
}
