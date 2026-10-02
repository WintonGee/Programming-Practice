import { expect, test, type Page } from '@playwright/test'
import { readProblemFile, seedProgress } from './fixtures'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test('mobile has no horizontal scroll and switches between views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /^Session Timer,/ })).toBeVisible()
  expect(await horizontalOverflow(page)).toBe(0)

  await seedProgress(page, 'session-timer', readProblemFile('session-timer/starter.py'))
  await page.goto('/p/session-timer')
  const views = page.getByRole('navigation', { name: 'Workspace views' })
  await expect(views).toBeVisible()
  expect(await horizontalOverflow(page)).toBe(0)

  await views.getByRole('button', { name: 'Prompt' }).click()
  await expect(page.getByRole('heading', { name: 'Open, close, and count' })).toBeVisible()
  expect(await horizontalOverflow(page)).toBe(0)

  await views.getByRole('button', { name: 'Code' }).click()
  await expect(page.locator('.cm-content')).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('class SessionTimer')
  await expect(page.getByRole('heading', { name: 'Open, close, and count' })).toBeHidden()
  expect(await horizontalOverflow(page)).toBe(0)
})
