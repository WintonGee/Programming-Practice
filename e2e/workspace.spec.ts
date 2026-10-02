import { expect, test } from '@playwright/test'
import { PYTHON_TIMEOUT, readProblemFile, seedProgress, stageTitle } from './fixtures'

const SLUG = 'session-timer'
const stage1Solution = readProblemFile(`${SLUG}/stages/1/solution.py`)

test('passing stage 1 unlocks stage 2', async ({ page }) => {
  await seedProgress(page, SLUG, stage1Solution)
  await page.goto(`/p/${SLUG}`)

  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('results-summary')).toContainText('11 of 11 passing', { timeout: PYTHON_TIMEOUT })
  await expect(page.getByText('Stage 1 complete')).toBeVisible()

  await page.getByRole('button', { name: 'Continue to stage 2' }).click()

  await expect(page.getByRole('heading', { name: stageTitle(SLUG, 2) })).toBeVisible()
  await expect(page.getByText('What changed in stage 2')).toBeVisible()
  const rail = page.getByRole('banner').getByRole('list')
  await expect(rail.locator('li').nth(0)).toHaveAttribute('data-state', 'passed')
  await expect(rail.locator('li').nth(1)).toHaveAttribute('data-state', 'current')
})

test('a syntax error shows the load-error banner with its line', async ({ page }) => {
  await seedProgress(page, SLUG, 'x = 1\ndef broken(:\n    pass\n')
  await page.goto(`/p/${SLUG}`)

  await page.getByRole('button', { name: 'Run tests' }).click()
  const banner = page.getByRole('alert')
  await expect(banner).toContainText('Your code didn’t load', { timeout: PYTHON_TIMEOUT })
  await expect(banner).toContainText('SyntaxError')
  await expect(banner).toContainText('line 2')
  await expect(page.locator('.cm-line.cm-errorLine')).toHaveCount(1)
})

test('an infinite loop times out and Python recovers for the next run', async ({ page }) => {
  test.setTimeout(120_000)
  const code = `${stage1Solution}\n\nif __name__ == "__main__":\n    while True:\n        pass\n`
  await seedProgress(page, SLUG, code)
  await page.goto(`/p/${SLUG}`)

  await page.getByRole('button', { name: 'Run file' }).click()
  await expect(page.getByText('Stopped after 8 seconds.')).toBeVisible({ timeout: PYTHON_TIMEOUT })
  await expect(page.getByText('Check for an infinite loop — Python was restarted.')).toBeVisible()

  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('results-summary')).toContainText('11 of 11 passing', { timeout: PYTHON_TIMEOUT })
})

test('code persists across reload', async ({ page }) => {
  await seedProgress(page, SLUG, readProblemFile(`${SLUG}/starter.py`))
  await page.goto(`/p/${SLUG}`)

  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('\n# persisted-marker-42')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  const stored = await page.evaluate(() => localStorage.getItem('staged:v1') ?? '')
  expect(stored).toContain('# persisted-marker-42')
  // CodeMirror only renders lines near the viewport; scroll to the end before reading the DOM.
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await expect(page.locator('.cm-content')).toContainText('# persisted-marker-42')
})

test('shows a warning when the browser refuses to save code', async ({ page }) => {
  await seedProgress(page, SLUG, readProblemFile(`${SLUG}/starter.py`))
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'staged:v1') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.goto(`/p/${SLUG}`)

  await page.locator('.cm-content').click()
  await page.keyboard.type('# edit')
  await expect(page.getByText('Not saved — browser storage unavailable')).toBeVisible()
})

test('a run queued behind a timed-out run still gets its full budget', async ({ page }) => {
  test.setTimeout(120_000)
  const code = `${stage1Solution}\n\nif __name__ == "__main__":\n    while True:\n        pass\n`
  await seedProgress(page, SLUG, code)
  await page.goto(`/p/${SLUG}`)

  await page.getByRole('button', { name: 'Run file' }).click()
  // Leave the workspace while Python is stuck, come back, and queue a test run behind it.
  // Client-side navigation keeps the same page, so the stuck worker is still alive.
  await page.getByRole('link', { name: /all problems|back/i }).first().click()
  await page.getByRole('link', { name: 'Session Timer' }).first().click()
  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('results-summary')).toContainText('11 of 11 passing', { timeout: PYTHON_TIMEOUT })
})

test('the workspace never scrolls as a page, only its panes do', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await seedProgress(page, SLUG, readProblemFile(`${SLUG}/starter.py`))
  await page.goto(`/p/${SLUG}`)
  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('results-summary')).toContainText('0 of 11 passing', { timeout: PYTHON_TIMEOUT })

  const pageScroll = () =>
    page.evaluate(() => ({
      top: document.scrollingElement!.scrollTop,
      overflow: document.scrollingElement!.scrollHeight - innerHeight,
    }))
  expect(await pageScroll()).toEqual({ top: 0, overflow: 0 })

  // Wheel far past the end of every pane, then jump the editor to a traceback line.
  for (const pane of ['Results', 'Problem', 'Code']) {
    await page.getByRole('region', { name: pane }).hover()
    for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 600)
  }
  await page.getByRole('button', { name: /solution\.py, line \d+/ }).first().click()
  expect(await pageScroll()).toEqual({ top: 0, overflow: 0 })
  await expect(page.getByRole('banner')).toBeInViewport()
})
