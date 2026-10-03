import { useMemo, useSyncExternalStore } from 'react'
import { createStoredStore } from './storage'

const STORAGE_KEY = 'staged:v1'

export type Mode = 'practice' | 'interview'

export interface Attempt {
  startedAt: number
  /** Stage number to the epoch ms it was first completed in this attempt. */
  stageCompletedAt: Record<number, number>
  testRuns: number
  /** Stage number to how many of its hints have been revealed. */
  hintsRevealed: Record<number, number>
  solutionViewed: number[]
  finishedAt?: number
  /** Interview mode: when the countdown reached zero. */
  timeUpAt?: number
}

export interface ProblemProgress {
  code: string
  unlockedStage: number
  completedStages: number[]
  mode: Mode
  attempt: Attempt
  updatedAt: number
}

export interface ProgressState {
  version: 1
  problems: Record<string, ProblemProgress>
}

/** `ready` = current stage passed, waiting for the user to continue. */
export type StageState = 'passed' | 'ready' | 'current' | 'locked'

export const emptyState = (): ProgressState => ({ version: 1, problems: {} })

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)

const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

function numberMap(v: unknown): Record<number, number> {
  const out: Record<number, number> = {}
  if (!isRecord(v)) return out
  for (const [k, n] of Object.entries(v)) {
    const key = Number(k)
    if (Number.isInteger(key) && key > 0 && isTime(n)) out[key] = n
  }
  return out
}

function stageList(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return [...new Set(v.filter((n): n is number => isInt(n) && n > 0))].sort((a, b) => a - b)
}

function parseAttempt(v: unknown, fallbackStart: number): Attempt {
  const a = isRecord(v) ? v : {}
  const attempt: Attempt = {
    startedAt: isTime(a.startedAt) ? a.startedAt : fallbackStart,
    stageCompletedAt: numberMap(a.stageCompletedAt),
    testRuns: isInt(a.testRuns) && a.testRuns >= 0 ? a.testRuns : 0,
    hintsRevealed: numberMap(a.hintsRevealed),
    solutionViewed: stageList(a.solutionViewed),
  }
  if (isTime(a.finishedAt)) attempt.finishedAt = a.finishedAt
  if (isTime(a.timeUpAt)) attempt.timeUpAt = a.timeUpAt
  return attempt
}

function parseProblemProgress(v: unknown): ProblemProgress | null {
  if (!isRecord(v) || typeof v.code !== 'string') return null
  const updatedAt = isTime(v.updatedAt) ? v.updatedAt : 0
  return {
    code: v.code,
    unlockedStage: isInt(v.unlockedStage) && v.unlockedStage > 0 ? v.unlockedStage : 1,
    completedStages: stageList(v.completedStages),
    mode: v.mode === 'interview' ? 'interview' : 'practice',
    attempt: parseAttempt(v.attempt, updatedAt),
    updatedAt,
  }
}

/** Parse persisted JSON. Anything malformed is dropped rather than trusted. */
export function parseState(raw: string | null): ProgressState {
  if (!raw) return emptyState()
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return emptyState()
  }
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.problems)) return emptyState()
  const problems: Record<string, ProblemProgress> = {}
  for (const [slug, value] of Object.entries(data.problems)) {
    const parsed = parseProblemProgress(value)
    if (parsed) problems[slug] = parsed
  }
  return { version: 1, problems }
}

export const serializeState = (state: ProgressState): string => JSON.stringify(state)

const allStagesCompleted = (completed: number[], stageCount: number): boolean =>
  stageCount >= 1 && Array.from({ length: stageCount }, (_, i) => i + 1).every((n) => completed.includes(n))

/**
 * Clamp stored progress to the problem as it exists now (stages can be added or removed),
 * and keep `finishedAt` consistent with whether every stage is completed.
 */
export function normalizeProgress(p: ProblemProgress, stageCount: number): ProblemProgress {
  const count = Math.max(1, stageCount)
  const completedStages = p.completedStages.filter((n) => n <= count)
  const unlockedStage = Math.min(Math.max(1, p.unlockedStage), count)
  const prune = (m: Record<number, number>) =>
    Object.fromEntries(Object.entries(m).filter(([k]) => Number(k) <= count)) as Record<number, number>
  const stageCompletedAt = prune(p.attempt.stageCompletedAt)
  const hintsRevealed = prune(p.attempt.hintsRevealed)
  const solutionViewed = p.attempt.solutionViewed.filter((n) => n <= count)
  const done = allStagesCompleted(completedStages, count)
  const lastCompletion = Math.max(0, ...Object.values(stageCompletedAt))
  const finishedAt = done ? (p.attempt.finishedAt ?? (lastCompletion || p.updatedAt)) : undefined
  if (
    unlockedStage === p.unlockedStage &&
    completedStages.length === p.completedStages.length &&
    finishedAt === p.attempt.finishedAt &&
    Object.keys(stageCompletedAt).length === Object.keys(p.attempt.stageCompletedAt).length &&
    Object.keys(hintsRevealed).length === Object.keys(p.attempt.hintsRevealed).length &&
    solutionViewed.length === p.attempt.solutionViewed.length
  ) {
    return p
  }
  const attempt: Attempt = { ...p.attempt, stageCompletedAt, hintsRevealed, solutionViewed }
  if (finishedAt === undefined) delete attempt.finishedAt
  else attempt.finishedAt = finishedAt
  return { ...p, unlockedStage, completedStages, attempt }
}

export function stageState(p: ProblemProgress | undefined, stage: number, stageCount: number): StageState {
  if (!p) return stage === 1 ? 'current' : 'locked'
  if (stage < p.unlockedStage) return 'passed'
  if (stage > p.unlockedStage) return 'locked'
  if (!p.completedStages.includes(stage)) return 'current'
  return stage === stageCount ? 'passed' : 'ready'
}

export const isFinished = (p: ProblemProgress | undefined, stageCount: number): boolean =>
  !!p && allStagesCompleted(p.completedStages, stageCount)

function update(
  state: ProgressState,
  slug: string,
  now: number,
  fn: (p: ProblemProgress) => ProblemProgress | null,
): ProgressState {
  const current = state.problems[slug]
  if (!current) return state
  const next = fn(current)
  if (!next) return state
  return { ...state, problems: { ...state.problems, [slug]: { ...next, updatedAt: now } } }
}

/** Begin a fresh attempt: starter code, stage 1, all attempt stats cleared. */
export function startAttempt(
  state: ProgressState,
  slug: string,
  mode: Mode,
  starter: string,
  now: number,
): ProgressState {
  const progress: ProblemProgress = {
    code: starter,
    unlockedStage: 1,
    completedStages: [],
    mode,
    attempt: { startedAt: now, stageCompletedAt: {}, testRuns: 0, hintsRevealed: {}, solutionViewed: [] },
    updatedAt: now,
  }
  return { ...state, problems: { ...state.problems, [slug]: progress } }
}

export const setCode = (state: ProgressState, slug: string, code: string, now: number): ProgressState =>
  update(state, slug, now, (p) => (p.code === code ? null : { ...p, code }))

/** Save code only into the attempt the editor was opened for; a newer attempt (e.g. from another tab) wins. */
export const setCodeForAttempt = (
  state: ProgressState,
  slug: string,
  attemptStartedAt: number,
  code: string,
  now: number,
): ProgressState =>
  state.problems[slug]?.attempt.startedAt === attemptStartedAt ? setCode(state, slug, code, now) : state

export const recordTestRun = (state: ProgressState, slug: string, now: number): ProgressState =>
  update(state, slug, now, (p) => ({ ...p, attempt: { ...p.attempt, testRuns: p.attempt.testRuns + 1 } }))

export interface StageResult {
  /** `attempt.startedAt` captured when the run began; results from an older attempt are ignored. */
  attemptStartedAt: number
  /** The stage the run tested. Must still be the current unlocked stage. */
  stage: number
  stageCount: number
}

/** Mark the current stage passed. Completing every stage finishes the attempt. */
export function completeStage(state: ProgressState, slug: string, result: StageResult, now: number): ProgressState {
  const { attemptStartedAt, stage, stageCount } = result
  return update(state, slug, now, (raw) => {
    const p = normalizeProgress(raw, stageCount)
    if (p.attempt.startedAt !== attemptStartedAt || stage !== p.unlockedStage || p.completedStages.includes(stage)) {
      return null
    }
    const completedStages = [...p.completedStages, stage].sort((a, b) => a - b)
    const attempt: Attempt = {
      ...p.attempt,
      stageCompletedAt: { ...p.attempt.stageCompletedAt, [stage]: now },
    }
    if (allStagesCompleted(completedStages, stageCount)) attempt.finishedAt = attempt.finishedAt ?? now
    return { ...p, completedStages, attempt }
  })
}

/** Move to the next stage, only once the current one is passed. */
export const unlockNextStage = (
  state: ProgressState,
  slug: string,
  stageCount: number,
  now: number,
): ProgressState =>
  update(state, slug, now, (p) =>
    p.completedStages.includes(p.unlockedStage) && p.unlockedStage < stageCount
      ? { ...p, unlockedStage: p.unlockedStage + 1 }
      : null,
  )

export const revealHint = (
  state: ProgressState,
  slug: string,
  stage: number,
  hintCount: number,
  now: number,
): ProgressState =>
  update(state, slug, now, (p) => {
    const shown = p.attempt.hintsRevealed[stage] ?? 0
    if (shown >= hintCount) return null
    return { ...p, attempt: { ...p.attempt, hintsRevealed: { ...p.attempt.hintsRevealed, [stage]: shown + 1 } } }
  })

export const markSolutionViewed = (state: ProgressState, slug: string, stage: number, now: number): ProgressState =>
  update(state, slug, now, (p) =>
    p.attempt.solutionViewed.includes(stage)
      ? null
      : {
          ...p,
          attempt: { ...p.attempt, solutionViewed: [...p.attempt.solutionViewed, stage].sort((a, b) => a - b) },
        },
  )

export const markTimeUp = (state: ProgressState, slug: string, now: number): ProgressState =>
  update(state, slug, now, (p) =>
    p.attempt.timeUpAt === undefined ? { ...p, attempt: { ...p.attempt, timeUpAt: now } } : null,
  )

export const interviewWindowMs = (estimatedMinutes: number): number => estimatedMinutes * 60_000

export const totalHintsRevealed = (a: Attempt): number =>
  Object.values(a.hintsRevealed).reduce((sum, n) => sum + n, 0)

/** The most recently touched problem that is started but not finished, among known slugs. */
export function mostRecentInProgress(
  state: ProgressState,
  stageCounts: Record<string, number>,
): { slug: string; progress: ProblemProgress } | null {
  let best: { slug: string; progress: ProblemProgress } | null = null
  for (const [slug, raw] of Object.entries(state.problems)) {
    const count = stageCounts[slug]
    if (count === undefined) continue
    const progress = normalizeProgress(raw, count)
    if (isFinished(progress, count)) continue
    if (!best || progress.updatedAt > best.progress.updatedAt) best = { slug, progress }
  }
  return best
}

const store = createStoredStore(STORAGE_KEY, parseState, serializeState)

export const getProgressState = store.read

/** Apply `fn` and persist. Returns whether the latest state is in storage (false if the browser refused the write). */
export const updateProgress: (fn: (state: ProgressState) => ProgressState) => boolean = store.update

export function useProgressState(): ProgressState {
  return useSyncExternalStore(store.subscribe, store.read, store.read)
}

export function useProblemProgress(slug: string, stageCount: number): ProblemProgress | undefined {
  const raw = useProgressState().problems[slug]
  return useMemo(() => (raw ? normalizeProgress(raw, stageCount) : undefined), [raw, stageCount])
}
