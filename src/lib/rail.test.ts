import { describe, expect, it } from 'vitest'
import { emptyState, normalizeProgress, startAttempt, type StageState } from '../state/progress'
import type { Problem, Stage } from '../types'
import { currentStage, railStages, railSummary, type RailStage } from './rail'

const rail = (states: StageState[]): RailStage[] => states.map((state, i) => ({ number: i + 1, title: `S${i + 1}`, state }))

const stage = (number: number): Stage => ({ number, title: `S${number}`, prompt: '', hints: [], tests: '', solution: '' })

const problem: Problem = {
  slug: 'p',
  title: 'P',
  difficulty: 'Easy',
  order: 1,
  tags: [],
  summary: '',
  estimatedMinutes: 30,
  starter: '',
  stages: [stage(1), stage(2)],
}

describe('railSummary', () => {
  it('counts ready as passed and as the current stage', () => {
    expect(railSummary(rail(['passed', 'passed', 'passed']))).toBe('All 3 stages passed')
    expect(railSummary(rail(['passed', 'ready', 'locked']))).toBe('Stage 2 of 3, 2 passed')
    expect(railSummary(rail(['current', 'locked', 'locked']))).toBe('Stage 1 of 3, 0 passed')
  })
})

describe('railStages', () => {
  it('locks every stage without progress', () => {
    expect(railStages(problem, undefined).map((s) => s.state)).toEqual(['locked', 'locked'])
  })
})

describe('currentStage', () => {
  it('maps the 1-based unlocked stage to its stage definition', () => {
    const progress = normalizeProgress(startAttempt(emptyState(), 'p', 'practice', '', 0).problems.p, 2)
    expect(currentStage(problem, progress)).toBe(problem.stages[0])
    expect(currentStage(problem, { ...progress, unlockedStage: 2 })).toBe(problem.stages[1])
  })
})
