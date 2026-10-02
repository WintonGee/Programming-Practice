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
