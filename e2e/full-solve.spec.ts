import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { countTests } from '../src/problems/parse'
import { PROBLEMS_DIR, PYTHON_TIMEOUT, problemSlugs, readProblemFile } from './fixtures'

// Solves every stage of every problem through the real UI, the way a person would:
// start practice, reveal the solution, copy it, paste it into the editor, run tests, continue.
for (const slug of problemSlugs()) {
  test(`solve every stage of ${slug}`, async ({ page, context }) => {
    test.setTimeout(180_000)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const { title } = JSON.parse(readProblemFile(`${slug}/problem.json`)) as { title: string }
    const stageCount = readdirSync(join(PROBLEMS_DIR, slug, 'stages')).length

    await page.goto('/')
    await page.getByRole('link', { name: title }).first().click()
    await page.getByRole('button', { name: 'Start practice' }).click()

    let passed = 0
    for (let stage = 1; stage <= stageCount; stage++) {
      await page.getByRole('tab', { name: 'Solution' }).click()
      await page.getByRole('button', { name: 'Show solution' }).click()
      await page.getByRole('button', { name: 'Reveal solution' }).click()
      await page.getByRole('button', { name: 'Copy' }).click()
      await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()

      const editor = page.getByRole('textbox', { name: 'Solution code editor' })
      await editor.click()
      await page.keyboard.press('ControlOrMeta+A')
      // Headless Chromium on macOS ignores the native Cmd+V paste command, so deliver the clipboard
      // contents (written by the app's Copy button) as a real paste event, which CodeMirror handles.
      const clip = await page.evaluate(() => navigator.clipboard.readText())
      expect(clip).toBe(readProblemFile(`${slug}/stages/${stage}/solution.py`))
      await editor.evaluate((el, text) => {
        const data = new DataTransfer()
        data.setData('text/plain', text)
        el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
      }, clip)
      await page.getByRole('button', { name: 'Run tests' }).click()
      const testsHere = countTests(readProblemFile(`${slug}/stages/${stage}/tests.py`))
      passed += testsHere
      await expect(page.getByTestId('results-summary')).toContainText(`${passed} of ${passed} passing`, {
        timeout: PYTHON_TIMEOUT,
      })

      if (stage < stageCount) {
        await page.getByRole('button', { name: `Continue to stage ${stage + 1}` }).click()
      } else {
        await expect(page.getByText('All stages complete')).toBeVisible()
      }
    }
  })
}
