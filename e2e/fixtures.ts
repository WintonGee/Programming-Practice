import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import type { ProgressState } from '../src/state/progress'
import type { HistoryState } from '../src/tutor/history'

export const PROBLEMS_DIR = join(import.meta.dirname, '..', 'problems')

export const problemSlugs = (): string[] =>
  readdirSync(PROBLEMS_DIR).filter((s) => existsSync(join(PROBLEMS_DIR, s, 'problem.json')))

export const readProblemFile = (rel: string): string => readFileSync(join(PROBLEMS_DIR, rel), 'utf8')

export const stageTitle = (slug: string, stage: number): string =>
  (JSON.parse(readProblemFile(`${slug}/stages/${stage}/stage.json`)) as { title: string }).title

/** Seed a localStorage key before the app boots. Only seeds once per tab, so reloads see what the app saved. */
async function seedStorage(page: Page, key: string, value: unknown) {
  await page.addInitScript(
    ([k, json]) => {
      const flag = `e2e-seeded:${k}`
      if (sessionStorage.getItem(flag)) return
      localStorage.setItem(k, json)
      sessionStorage.setItem(flag, '1')
    },
    [key, JSON.stringify(value)] as const,
  )
}

/** Seed progress for one problem. */
export async function seedProgress(page: Page, slug: string, code: string) {
  const now = Date.now()
  const state: ProgressState = {
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
  await seedStorage(page, 'staged:v1', state)
}

export const seedHistory = (page: Page, threads: HistoryState['threads']) =>
  seedStorage(page, 'staged:tutor:v1', { version: 1, threads } satisfies HistoryState)

export const pageScroll = (page: Page) =>
  page.evaluate(() => ({
    top: document.scrollingElement!.scrollTop,
    overflow: document.scrollingElement!.scrollHeight - innerHeight,
  }))

export const PYTHON_TIMEOUT = 45_000
