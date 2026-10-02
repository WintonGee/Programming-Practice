import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

const PROBLEMS = join(import.meta.dirname, '..', 'problems')

export const readProblemFile = (rel: string): string => readFileSync(join(PROBLEMS, rel), 'utf8')

export const stageTitle = (slug: string, stage: number): string =>
  (JSON.parse(readProblemFile(`${slug}/stages/${stage}/stage.json`)) as { title: string }).title

/** Seed progress for one problem before the app boots. Only seeds once per tab, so reloads see what the app saved. */
export async function seedProgress(page: Page, slug: string, code: string) {
  const now = Date.now()
  const state = {
    version: 1,
    problems: {
      [slug]: {
        code,
        unlockedStage: 1,
        completedStages: [],
        mode: 'practice',
        attempt: { startedAt: now, stageCompletedAt: {}, testRuns: 0, hintsRevealed: {}, solutionViewed: [] },
        updatedAt: now,
      },
    },
  }
  await page.addInitScript((json) => {
    if (sessionStorage.getItem('e2e-seeded')) return
    localStorage.setItem('staged:v1', json)
    sessionStorage.setItem('e2e-seeded', '1')
  }, JSON.stringify(state))
}

export const PYTHON_TIMEOUT = 45_000
