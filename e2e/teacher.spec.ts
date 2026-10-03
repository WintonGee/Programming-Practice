import { expect, test, type Page, type Route } from '@playwright/test'
import type { TutorRequest } from '../src/tutor/protocol'
import { PYTHON_TIMEOUT, readProblemFile, seedProgress } from './fixtures'

const SLUG = 'session-timer'
const starter = readProblemFile(`${SLUG}/starter.py`)
const promptStart = readProblemFile(`${SLUG}/stages/1/prompt.md`).split('\n')[0].slice(0, 60)

const ANSWER_CHUNKS = [
  'Here is the **idea** behind ',
  'this stage.\n\n```python\nclass SessionTimer:\n',
  '    def __init__(self, clock):\n        self.clock = clock\n```\n\n',
  'Ask the clock for the time.',
]

const sseBody = (chunks = ANSWER_CHUNKS) =>
  [...chunks.map((text) => ({ type: 'text', text })), { type: 'done' }]
    .map((e) => `data: ${JSON.stringify(e)}\n\n`)
    .join('')

/** Intercept the tutor endpoint; never hits a real model. Returns the captured request bodies. */
async function mockTutor(page: Page, respond?: (route: Route) => Promise<void>) {
  const requests: TutorRequest[] = []
  await page.route('**/api/tutor', async (route) => {
    requests.push(route.request().postDataJSON() as TutorRequest)
    if (respond) return respond(route)
    await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8' }, body: sseBody() })
  })
  return requests
}

async function seedHistory(page: Page, threads: Record<string, { id: string; role: string; content: string }[]>) {
  await page.addInitScript((json) => {
    if (sessionStorage.getItem('e2e-tutor-seeded')) return
    localStorage.setItem('staged:tutor:v1', json)
    sessionStorage.setItem('e2e-tutor-seeded', '1')
  }, JSON.stringify({ version: 1, threads }))
}

const openTeacherTab = (page: Page) => page.getByRole('tab', { name: 'Teacher' }).click()
const conversation = (page: Page) => page.getByRole('log', { name: 'Conversation with the teacher' })

const pageOverflow = (page: Page) =>
  page.evaluate(() => ({
    top: document.scrollingElement!.scrollTop,
    overflow: document.scrollingElement!.scrollHeight - innerHeight,
  }))

test('workspace Teacher tab streams a markdown answer with the stage, live code and mode as context', async ({ page }) => {
  const requests = await mockTutor(page)
  await seedProgress(page, SLUG, starter)
  await page.goto(`/p/${SLUG}`)

  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('\n# live-marker-7')

  await openTeacherTab(page)
  await expect(page.getByText('The teacher sees this stage’s prompt, your code, and your latest test results.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Why are my tests failing?' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Explain this stage' }).click()

  const log = conversation(page)
  await expect(log.getByText('Explain this stage')).toBeVisible()
  await expect(log.getByText('Ask the clock for the time.')).toBeVisible()
  await expect(log.locator('strong', { hasText: 'idea' })).toBeVisible()
  await expect(log.locator('pre')).toContainText('self.clock = clock')

  expect(requests).toHaveLength(1)
  const [req] = requests
  expect(req.context.kind).toBe('problem')
  if (req.context.kind !== 'problem') throw new Error('expected a problem context')
  expect(req.context.mode).toBe('practice')
  expect(req.context.stageNumber).toBe(1)
  expect(req.context.prompt).toContain(promptStart)
  expect(req.context.code).toContain('class SessionTimer')
  expect(req.context.code).toContain('# live-marker-7')
  expect(req.messages).toEqual([{ role: 'user', content: 'Explain this stage' }])
})

test('after a failing run the teacher receives the failures', async ({ page }) => {
  const requests = await mockTutor(page)
  await seedProgress(page, SLUG, starter)
  await page.goto(`/p/${SLUG}`)

  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('results-summary')).toContainText('0 of 11 passing', { timeout: PYTHON_TIMEOUT })

  await openTeacherTab(page)
  await page.getByRole('button', { name: 'Why are my tests failing?' }).click()
  await expect(conversation(page).getByText('Ask the clock for the time.')).toBeVisible()

  const ctx = requests[0].context
  if (ctx.kind !== 'problem') throw new Error('expected a problem context')
  expect(ctx.lastRun?.summary).toBe('0 of 11 passing')
  expect(ctx.lastRun?.failures.length).toBeGreaterThan(0)
  expect(ctx.lastRun?.failures[0]).toEqual(
    expect.objectContaining({ stage: 1, name: expect.stringMatching(/^test_/), message: expect.any(String) }),
  )
})

test('a rate-limited question shows the wait message and can be retried', async ({ page }) => {
  let calls = 0
  await mockTutor(page, async (route) => {
    calls++
    if (calls === 1) await route.fulfill({ status: 429, json: { error: 'Too many questions.' } })
    else await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sseBody() })
  })
  await seedProgress(page, SLUG, starter)
  await page.goto(`/p/${SLUG}`)
  await openTeacherTab(page)
  await page.getByRole('button', { name: 'Review my code' }).click()

  const alert = conversation(page).getByRole('alert')
  await expect(alert).toContainText('You’re asking quickly — wait a minute and try again.')
  await alert.getByRole('button', { name: 'Retry' }).click()
  await expect(conversation(page).getByText('Ask the clock for the time.')).toBeVisible()
  await expect(conversation(page).getByRole('alert')).toHaveCount(0)
})

test('a server error shows the server’s explanation', async ({ page }) => {
  const message = 'Today’s free Workers AI allowance for this site is used up. It resets at 00:00 UTC.'
  await mockTutor(page, (route) => route.fulfill({ status: 502, json: { error: message } }))
  await page.goto('/teacher')
  await page.getByRole('button', { name: 'Explain Python dataclasses' }).click()
  await expect(conversation(page).getByRole('alert')).toContainText(message)
})

test('the conversation persists across reload and Clear conversation empties it', async ({ page }) => {
  await mockTutor(page)
  await seedProgress(page, SLUG, starter)
  await page.goto(`/p/${SLUG}`)
  await openTeacherTab(page)

  const input = page.getByRole('textbox', { name: 'Message the teacher' })
  await input.fill('How should I store sessions?')
  await input.press('Enter')
  await expect(conversation(page).getByText('Ask the clock for the time.')).toBeVisible()

  await page.reload()
  await openTeacherTab(page)
  await expect(conversation(page).getByText('How should I store sessions?')).toBeVisible()
  await expect(conversation(page).getByText('Ask the clock for the time.')).toBeVisible()

  await page.getByRole('button', { name: 'Clear conversation' }).click()
  await page.getByRole('group', { name: 'Confirm' }).getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByRole('heading', { name: 'Ask the teacher' })).toBeVisible()
  await expect(conversation(page).getByText('How should I store sessions?')).toHaveCount(0)

  await page.reload()
  await openTeacherTab(page)
  await expect(page.getByRole('heading', { name: 'Ask the teacher' })).toBeVisible()
})

test('the /teacher page answers general questions', async ({ page }) => {
  const requests = await mockTutor(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Teacher', exact: true }).click()
  await expect(page).toHaveURL(/\/teacher$/)
  await expect(page.getByRole('heading', { name: 'Teacher', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'When should I use a heap?' }).click()
  await expect(conversation(page).locator('pre')).toContainText('class SessionTimer')
  expect(requests[0].context).toEqual({ kind: 'general' })
  expect(requests[0].messages).toEqual([{ role: 'user', content: 'When should I use a heap?' }])
})

test('a long conversation scrolls inside the chat, never the document', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  const long = (i: number) => ({
    id: `seed-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}. ${'A long line of explanation that wraps several times. '.repeat(12)}`,
  })
  const messages = Array.from({ length: 40 }, (_, i) => long(i))
  await seedHistory(page, { general: messages, [SLUG]: messages })
  await seedProgress(page, SLUG, starter)

  await page.goto('/teacher')
  await expect(conversation(page).getByText('Message 39.')).toBeInViewport()
  for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 800)
  expect(await pageOverflow(page)).toEqual({ top: 0, overflow: 0 })
  const sh = await page.evaluate(() => document.scrollingElement!.scrollHeight === innerHeight)
  expect(sh).toBe(true)

  await page.goto(`/p/${SLUG}`)
  await openTeacherTab(page)
  await expect(conversation(page).getByText('Message 39.')).toBeInViewport()
  await conversation(page).hover()
  for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 800)
  expect(await pageOverflow(page)).toEqual({ top: 0, overflow: 0 })
  await expect(page.getByRole('textbox', { name: 'Message the teacher' })).toBeInViewport()
})

test('on mobile the composer stays above the bottom navigation', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await seedProgress(page, SLUG, starter)
  await page.goto(`/p/${SLUG}`)
  await page.getByRole('navigation', { name: 'Workspace views' }).getByRole('button', { name: 'Prompt' }).click()
  await openTeacherTab(page)

  const input = page.getByRole('textbox', { name: 'Message the teacher' })
  await expect(input).toBeInViewport()
  const inputBox = (await input.boundingBox())!
  const navBox = (await page.getByRole('navigation', { name: 'Workspace views' }).boundingBox())!
  expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(navBox.y)
  await context.close()
})

test('math in an answer renders with KaTeX instead of raw LaTeX', async ({ page }) => {
  await mockTutor(page, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      body: sseBody(['A heap push is $O(\\log n)$, ', 'so insert $\\rightarrow$ heap.']),
    }),
  )
  await page.goto('/teacher')
  await page.getByRole('button', { name: 'When should I use a heap?' }).click()
  const log = conversation(page)
  await expect(log.locator('.katex')).toHaveCount(2)
  await expect(log).not.toContainText('$')
})
