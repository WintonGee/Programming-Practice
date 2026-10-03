import { stageState, type ProblemProgress, type StageState } from '../state/progress'
import type { Problem } from '../types'

export interface RailStage {
  number: number
  title: string
  state: StageState
}

export const stateLabel: Record<StageState, string> = {
  passed: 'passed',
  ready: 'passed, ready to continue',
  current: 'in progress',
  locked: 'locked',
}

export function railSummary(stages: RailStage[]): string {
  const passed = stages.filter((s) => s.state === 'passed' || s.state === 'ready').length
  const current = stages.find((s) => s.state === 'current' || s.state === 'ready')
  if (passed === stages.length) return `All ${stages.length} stages passed`
  return `Stage ${current?.number ?? 1} of ${stages.length}, ${passed} passed`
}

export const currentStage = (problem: Problem, progress: ProblemProgress) => problem.stages[progress.unlockedStage - 1]

export const railStages = (problem: Problem, progress: ProblemProgress | undefined): RailStage[] =>
  problem.stages.map((s) => ({
    number: s.number,
    title: s.title,
    state: progress ? stageState(progress, s.number, problem.stages.length) : 'locked',
  }))
