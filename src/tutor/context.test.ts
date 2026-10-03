import { describe, expect, it } from 'vitest'
import { startAttempt, type ProblemProgress } from '../state/progress'
import type { Problem, TestResult, TestRun } from '../types'
import type { TestRunRecord } from '../workspace/types'
import { TRUNCATED } from './clip'
import { buildProblemContext, emptyState, summarizeRun } from './context'
import { LIMITS } from './protocol'


const T0 = Date.UTC(2026, 9, 2, 12, 0, 0)

const problem: Problem = {
  slug: 'p',
  title: 'Session Timer',
  difficulty: 'Easy',
  order: 1,
  tags: [],
  summary: '',
  estimatedMinutes: 45,
  starter: 'class A: pass',
  stages: [1, 2, 3].map((n) => ({
    number: n,
    title: `Stage title ${n}`,
    prompt: `Prompt for stage ${n}`,
    hints: [],
    tests: '',
    solution: '',
  })),
}

const progressAt = (stage: number, mode: 'practice' | 'interview' = 'practice'): ProblemProgress => ({
  ...startAttempt({ version: 1, problems: {} }, 'p', mode, 'starter', T0).problems.p,
  unlockedStage: stage,
})

const result = (status: TestResult['status'], i: number): TestResult => ({
  stage: 1,
  name: `test_${i}`,
  doc: `Does thing ${i}`,
  status,
  message: `AssertionError: ${i}`,
  line: 3,
  code: 'assert x == 1',
  frames: [],
  stdout: '',
  ms: 1,
})

const record = (run: TestRun, stage = 1): TestRunRecord => ({ run, stage, code: '' })

describe('summarizeRun', () => {
  it('is undefined with no run, or a run from another stage', () => {
    expect(summarizeRun(null, 1)).toBeUndefined()
    expect(summarizeRun(record({ kind: 'ok', loadError: null, results: [], ms: 1 }, 1), 2)).toBeUndefined()
  })

  it('summarizes passing counts and keeps up to LIMITS.failures failures', () => {
    const results = [result('pass', 0), ...Array.from({ length: 14 }, (_, i) => result(i % 2 ? 'fail' : 'error', i + 1))]
    const run = summarizeRun(record({ kind: 'ok', loadError: null, results, ms: 1 }), 1)!
    expect(run.summary).toBe('1 of 15 passing')
    expect(run.failures).toHaveLength(LIMITS.failures)
    expect(run.failures[0]).toEqual({ stage: 1, name: 'test_1', doc: 'Does thing 1', message: 'AssertionError: 1', code: 'assert x == 1' })
    expect(run.loadError).toBeUndefined()
  })

  it('reports a load error with its line', () => {
    const run = summarizeRun(
      record({ kind: 'ok', loadError: { message: 'SyntaxError: invalid syntax', line: 2 }, results: [], ms: 1 }),
      1,
    )!
    expect(run).toEqual({ summary: 'Code didn’t load', failures: [], loadError: 'SyntaxError: invalid syntax (line 2)' })
  })

  it('describes timeouts and crashes', () => {
    expect(summarizeRun(record({ kind: 'timeout', ms: 8000 }), 1)!.summary).toMatch(/Timed out/)
    expect(summarizeRun(record({ kind: 'crash', message: 'worker died' }), 1)!.summary).toBe('Run failed: worker died')
  })

  it('clips long failure fields to what the server accepts', () => {
    const long = { ...result('fail', 1), message: 'm'.repeat(5000), code: 'c'.repeat(900) }
    const run = summarizeRun(record({ kind: 'ok', loadError: null, results: [long], ms: 1 }), 1)!
    expect(run.failures[0].message.length).toBeLessThanOrEqual(2000)
    expect(run.failures[0].code.length).toBeLessThanOrEqual(500)
  })
})

describe('buildProblemContext', () => {
  it('describes the current unlocked stage with live code and the latest run', () => {
    const results = [result('fail', 1)]
    const ctx = buildProblemContext({
      problem,
      progress: progressAt(2),
      code: 'class Live: pass',
      testRun: record({ kind: 'ok', loadError: null, results, ms: 1 }, 2),
    })
    expect(ctx).toEqual({
      kind: 'problem',
      mode: 'practice',
      problemTitle: 'Session Timer',
      difficulty: 'Easy',
      stageNumber: 2,
      stageCount: 3,
      stageTitle: 'Stage title 2',
      prompt: 'Prompt for stage 2',
      earlierStages: ['Stage title 1'],
      code: 'class Live: pass',
      lastRun: { summary: '0 of 1 passing', failures: [expect.objectContaining({ name: 'test_1' })] },
    })
  })

  it('omits lastRun before any run and carries interview mode', () => {
    const ctx = buildProblemContext({ problem, progress: progressAt(1, 'interview'), code: '', testRun: null })
    expect(ctx.mode).toBe('interview')
    expect(ctx.earlierStages).toEqual([])
    expect('lastRun' in ctx).toBe(false)
  })

  it('clips long code and prompt to LIMITS', () => {
    const longPrompt = { ...problem, stages: problem.stages.map((s) => ({ ...s, prompt: 'p'.repeat(LIMITS.promptChars + 10) })) }
    const ctx = buildProblemContext({ problem: longPrompt, progress: progressAt(1), code: 'c'.repeat(LIMITS.codeChars + 10), testRun: null })
    expect(ctx.code).toHaveLength(LIMITS.codeChars)
    expect(ctx.code.endsWith(TRUNCATED)).toBe(true)
    expect(ctx.prompt).toHaveLength(LIMITS.promptChars)
  })
})

describe('emptyState', () => {
  it('offers the failing-tests chip only after a run with failures', () => {
    expect(emptyState({ kind: 'problem', mode: 'practice', hasFailures: false }).suggestions).not.toContain(
      'Why are my tests failing?',
    )
    expect(emptyState({ kind: 'problem', mode: 'practice', hasFailures: true }).suggestions).toEqual([
      'Explain this stage',
      'Why are my tests failing?',
      'Review my code',
      'Give me a small hint',
    ])
  })

  it('switches to interviewer prompts in interview mode, and general prompts off-problem', () => {
    const interview = emptyState({ kind: 'problem', mode: 'interview', hasFailures: true })
    expect(interview.suggestions).toEqual(['Can you clarify the requirements?', 'Is my approach reasonable?'])
    expect(interview.intro).toMatch(/interviewer/)
    expect(emptyState({ kind: 'general' }).suggestions).toHaveLength(3)
  })
})
