import { describe, expect, it } from 'vitest'
import {
  completeStage,
  emptyState,
  isFinished,
  markSolutionViewed,
  markTimeUp,
  mostRecentInProgress,
  normalizeProgress,
  parseState,
  recordTestRun,
  revealHint,
  serializeState,
  setCode,
  setCodeForAttempt,
  stageState,
  startAttempt,
  totalHintsRevealed,
  unlockNextStage,
  type ProgressState,
} from './progress'

const T0 = Date.UTC(2026, 9, 2, 12, 0, 0)

const started = (slug = 'p', mode: 'practice' | 'interview' = 'practice'): ProgressState =>
  startAttempt(emptyState(), slug, mode, 'starter', T0)

describe('startAttempt', () => {
  it('creates a fresh attempt at stage 1 with the starter code', () => {
    const p = started().problems.p
    expect(p).toEqual({
      code: 'starter',
      unlockedStage: 1,
      completedStages: [],
      mode: 'practice',
      attempt: { startedAt: T0, stageCompletedAt: {}, testRuns: 0, hintsRevealed: {}, solutionViewed: [] },
      updatedAt: T0,
    })
  })

  it('replaces a previous attempt entirely', () => {
    let s = started()
    s = setCode(s, 'p', 'edited', T0 + 1)
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 2)
    s = unlockNextStage(s, 'p', 3, T0 + 3)
    s = revealHint(s, 'p', 2, 4, T0 + 4)
    s = startAttempt(s, 'p', 'interview', 'starter', T0 + 10)
    expect(s.problems.p.code).toBe('starter')
    expect(s.problems.p.unlockedStage).toBe(1)
    expect(s.problems.p.completedStages).toEqual([])
    expect(s.problems.p.mode).toBe('interview')
    expect(s.problems.p.attempt.hintsRevealed).toEqual({})
    expect(s.problems.p.attempt.startedAt).toBe(T0 + 10)
  })
})

describe('reducers', () => {
  it('ignores unknown slugs and returns the same state', () => {
    const s = emptyState()
    expect(setCode(s, 'nope', 'x', T0)).toBe(s)
    expect(recordTestRun(s, 'nope', T0)).toBe(s)
    expect(completeStage(s, 'nope', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0)).toBe(s)
  })

  it('setCode updates code and updatedAt, and is a no-op for identical code', () => {
    const s = started()
    const next = setCode(s, 'p', 'new', T0 + 500)
    expect(next.problems.p.code).toBe('new')
    expect(next.problems.p.updatedAt).toBe(T0 + 500)
    expect(setCode(next, 'p', 'new', T0 + 900)).toBe(next)
  })

  it('counts test runs', () => {
    let s = started()
    s = recordTestRun(s, 'p', T0 + 1)
    s = recordTestRun(s, 'p', T0 + 2)
    expect(s.problems.p.attempt.testRuns).toBe(2)
  })

  it('completes a stage once, recording the first completion time', () => {
    let s = completeStage(started(), 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 60_000)
    expect(s.problems.p.completedStages).toEqual([1])
    expect(s.problems.p.attempt.stageCompletedAt).toEqual({ 1: T0 + 60_000 })
    const again = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 90_000)
    expect(again).toBe(s)
    s = again
    expect(s.problems.p.attempt.finishedAt).toBeUndefined()
  })

  it('rejects stages outside 1..stageCount', () => {
    const s = started()
    expect(completeStage(s, 'p', { attemptStartedAt: T0, stage: 0, stageCount: 3 }, T0)).toBe(s)
    expect(completeStage(s, 'p', { attemptStartedAt: T0, stage: 4, stageCount: 3 }, T0)).toBe(s)
  })

  it('unlocks the next stage only after the current one is passed', () => {
    let s = started()
    expect(unlockNextStage(s, 'p', 3, T0)).toBe(s)
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 1)
    s = unlockNextStage(s, 'p', 3, T0 + 2)
    expect(s.problems.p.unlockedStage).toBe(2)
    expect(unlockNextStage(s, 'p', 3, T0 + 3)).toBe(s)
  })

  it('finishes the attempt when the last stage completes and never unlocks past it', () => {
    let s = started()
    for (const stage of [1, 2, 3]) {
      s = completeStage(s, 'p', { attemptStartedAt: T0, stage, stageCount: 3 }, T0 + stage * 1000)
      s = unlockNextStage(s, 'p', 3, T0 + stage * 1000 + 1)
    }
    const p = s.problems.p
    expect(p.unlockedStage).toBe(3)
    expect(p.attempt.finishedAt).toBe(T0 + 3000)
    expect(isFinished(p, 3)).toBe(true)
  })

  it('only completes the current unlocked stage', () => {
    const s = started()
    expect(completeStage(s, 'p', { attemptStartedAt: T0, stage: 2, stageCount: 3 }, T0 + 1)).toBe(s)
  })

  it('ignores a run result that lands after the user continued', () => {
    let s = completeStage(started(), 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 1)
    s = unlockNextStage(s, 'p', 3, T0 + 2)
    expect(completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 3)).toBe(s)
    expect(s.problems.p.completedStages).toEqual([1])
  })

  it('ignores a run result from an attempt that was replaced by Start over', () => {
    const s = startAttempt(started(), 'p', 'practice', 'starter', T0 + 10)
    expect(completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 20)).toBe(s)
  })

  it('finishes the attempt when a stage added later is completed', () => {
    let s = started()
    for (const stage of [1, 2, 3]) {
      s = completeStage(s, 'p', { attemptStartedAt: T0, stage, stageCount: 3 }, T0 + stage)
      s = unlockNextStage(s, 'p', 3, T0 + stage)
    }
    s = unlockNextStage(s, 'p', 4, T0 + 10)
    expect(s.problems.p.unlockedStage).toBe(4)
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 4, stageCount: 4 }, T0 + 50)
    expect(s.problems.p.attempt.finishedAt).toBe(T0 + 50)
    expect(isFinished(s.problems.p, 4)).toBe(true)
  })

  it('reveals hints one at a time up to the hint count', () => {
    let s = started()
    s = revealHint(s, 'p', 1, 2, T0 + 1)
    s = revealHint(s, 'p', 1, 2, T0 + 2)
    const capped = revealHint(s, 'p', 1, 2, T0 + 3)
    expect(capped).toBe(s)
    s = revealHint(s, 'p', 2, 4, T0 + 4)
    expect(s.problems.p.attempt.hintsRevealed).toEqual({ 1: 2, 2: 1 })
    expect(totalHintsRevealed(s.problems.p.attempt)).toBe(3)
  })

  it('records solution views per stage without duplicates', () => {
    let s = markSolutionViewed(started(), 'p', 2, T0 + 1)
    s = markSolutionViewed(s, 'p', 1, T0 + 2)
    expect(markSolutionViewed(s, 'p', 2, T0 + 3)).toBe(s)
    expect(s.problems.p.attempt.solutionViewed).toEqual([1, 2])
  })

  it('records time up only once', () => {
    let s = markTimeUp(started('p', 'interview'), 'p', T0 + 75 * 60_000)
    s = markTimeUp(s, 'p', T0 + 80 * 60_000)
    expect(s.problems.p.attempt.timeUpAt).toBe(T0 + 75 * 60_000)
  })
})

describe('stageState', () => {
  it('derives passed, ready, current and locked', () => {
    let s = completeStage(started(), 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0)
    expect([1, 2, 3].map((n) => stageState(s.problems.p, n, 3))).toEqual(['ready', 'locked', 'locked'])
    s = unlockNextStage(s, 'p', 3, T0)
    expect([1, 2, 3].map((n) => stageState(s.problems.p, n, 3))).toEqual(['passed', 'current', 'locked'])
  })

  it('shows the last stage as passed once completed', () => {
    let s = started()
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 1 }, T0)
    expect(stageState(s.problems.p, 1, 1)).toBe('passed')
  })

  it('treats a problem with no progress as on stage 1', () => {
    expect([1, 2].map((n) => stageState(undefined, n, 2))).toEqual(['current', 'locked'])
  })
})

describe('serialization', () => {
  it('round-trips through JSON', () => {
    let s = started()
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 3 }, T0 + 5)
    s = revealHint(s, 'p', 1, 3, T0 + 6)
    expect(parseState(serializeState(s))).toEqual(s)
  })

  it('returns empty state for missing, corrupt, or foreign data', () => {
    expect(parseState(null)).toEqual(emptyState())
    expect(parseState('{not json')).toEqual(emptyState())
    expect(parseState('[]')).toEqual(emptyState())
    expect(parseState(JSON.stringify({ version: 2, problems: {} }))).toEqual(emptyState())
  })

  it('drops malformed entries and repairs malformed fields', () => {
    const raw = JSON.stringify({
      version: 1,
      problems: {
        bad: { unlockedStage: 2 },
        ok: {
          code: 'x',
          unlockedStage: 'two',
          completedStages: [2, 1, 1, -3, 'a'],
          mode: 'speedrun',
          attempt: { startedAt: 'yesterday', hintsRevealed: { 1: 2, x: 1, 2: -1 }, testRuns: 1.5 },
          updatedAt: T0,
        },
      },
    })
    const s = parseState(raw)
    expect(Object.keys(s.problems)).toEqual(['ok'])
    expect(s.problems.ok).toEqual({
      code: 'x',
      unlockedStage: 1,
      completedStages: [1, 2],
      mode: 'practice',
      attempt: { startedAt: T0, stageCompletedAt: {}, testRuns: 0, hintsRevealed: { 1: 2 }, solutionViewed: [] },
      updatedAt: T0,
    })
  })
})

describe('normalizeProgress', () => {
  it('returns the same object when nothing is out of range', () => {
    const p = started().problems.p
    expect(normalizeProgress(p, 3)).toBe(p)
  })

  it('clamps progress when a problem loses stages', () => {
    let s = started()
    for (const stage of [1, 2, 3, 4]) {
      s = revealHint(s, 'p', stage, 4, T0)
      s = markSolutionViewed(s, 'p', stage, T0)
      s = completeStage(s, 'p', { attemptStartedAt: T0, stage, stageCount: 4 }, T0 + stage)
      s = unlockNextStage(s, 'p', 4, T0 + stage)
    }
    const p = normalizeProgress(s.problems.p, 3)
    expect(p.unlockedStage).toBe(3)
    expect(p.completedStages).toEqual([1, 2, 3])
    expect(Object.keys(p.attempt.stageCompletedAt)).toEqual(['1', '2', '3'])
    expect(Object.keys(p.attempt.hintsRevealed)).toEqual(['1', '2', '3'])
    expect(p.attempt.solutionViewed).toEqual([1, 2, 3])
    expect(isFinished(p, 3)).toBe(true)
  })
})

describe('normalizeProgress finish state', () => {
  const twoOfThree = () => {
    let s = started()
    for (const stage of [1, 2]) {
      s = completeStage(s, 'p', { attemptStartedAt: T0, stage, stageCount: 3 }, T0 + stage * 1000)
      s = unlockNextStage(s, 'p', 3, T0 + stage * 1000)
    }
    return s.problems.p
  }

  it('sets finishedAt from the last completion when removed stages leave everything completed', () => {
    const p = normalizeProgress(twoOfThree(), 2)
    expect(p.attempt.finishedAt).toBe(T0 + 2000)
    expect(isFinished(p, 2)).toBe(true)
  })

  it('falls back to updatedAt when no completion times were recorded', () => {
    const raw = { ...twoOfThree(), updatedAt: T0 + 9 }
    const p = normalizeProgress({ ...raw, attempt: { ...raw.attempt, stageCompletedAt: {} } }, 2)
    expect(p.attempt.finishedAt).toBe(T0 + 9)
  })

  it('clears finishedAt when a new stage is added after finishing', () => {
    let s = started()
    s = completeStage(s, 'p', { attemptStartedAt: T0, stage: 1, stageCount: 1 }, T0 + 5)
    expect(s.problems.p.attempt.finishedAt).toBe(T0 + 5)
    const p = normalizeProgress(s.problems.p, 2)
    expect(p.attempt.finishedAt).toBeUndefined()
    expect('finishedAt' in p.attempt).toBe(false)
    expect(isFinished(p, 2)).toBe(false)
  })
})

describe('setCodeForAttempt', () => {
  it('saves into the attempt the editor was opened for', () => {
    const s = setCodeForAttempt(started(), 'p', T0, 'mine', T0 + 1)
    expect(s.problems.p.code).toBe('mine')
  })

  it('does not overwrite a newer attempt started elsewhere', () => {
    const s = startAttempt(started(), 'p', 'interview', 'starter', T0 + 100)
    expect(setCodeForAttempt(s, 'p', T0, 'stale edit', T0 + 200)).toBe(s)
  })
})

describe('mostRecentInProgress', () => {
  it('picks the latest unfinished problem among known slugs', () => {
    let s = started('a')
    s = startAttempt(s, 'b', 'practice', 'starter', T0 + 10)
    s = startAttempt(s, 'gone', 'practice', 'starter', T0 + 99)
    s = setCode(s, 'a', 'edit', T0 + 20)
    expect(mostRecentInProgress(s, { a: 3, b: 3 })?.slug).toBe('a')
    s = completeStage(s, 'a', { attemptStartedAt: T0, stage: 1, stageCount: 1 }, T0 + 30)
    expect(mostRecentInProgress(s, { a: 1, b: 3 })?.slug).toBe('b')
    expect(mostRecentInProgress(emptyState(), { a: 3 })).toBeNull()
  })
})
