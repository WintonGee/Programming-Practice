import { expect, test } from '@playwright/test'

test('home lists Session Timer and opens it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Practice progressive coding interviews' })).toBeVisible()
  const row = page.getByRole('link', { name: /^Session Timer,/ })
  await expect(row).toBeVisible()
  await row.click()

  await expect(page).toHaveURL(/\/p\/session-timer$/)
  await expect(page.getByRole('heading', { name: 'Session Timer' })).toBeVisible()
  await page.getByRole('button', { name: 'Start practice' }).click()

  await expect(page.locator('.cm-content')).toContainText('class SessionTimer')
  await expect(page.getByRole('heading', { name: 'Open, close, and count' })).toBeVisible()
})

test('unknown problem shows a not-found page with a way home', async ({ page }) => {
  await page.goto('/p/does-not-exist')
  await expect(page.getByRole('heading', { name: /doesn’t exist/ })).toBeVisible()
  await page.getByRole('link', { name: 'Back to problems' }).click()
  await expect(page).toHaveURL(/\/$/)
})
