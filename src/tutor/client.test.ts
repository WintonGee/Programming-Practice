import { afterEach, describe, expect, it, vi } from 'vitest'
import { RATE_LIMITED, readEvents, streamTutor, trimRequest } from './client'
import { LIMITS, type ChatMessage, type ProblemContext, type TutorEvent, type TutorRequest } from './protocol'

const streamOf = (chunks: (string | Uint8Array)[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(typeof c === 'string' ? encoder.encode(c) : c)
      controller.close()
    },
  })
}

const collect = async (chunks: (string | Uint8Array)[]) => {
  const events: TutorEvent[] = []
  const final = await readEvents(streamOf(chunks), (e) => events.push(e))
  return { events, final }
}

describe('readEvents', () => {
  it('parses events split at awkward chunk boundaries', async () => {
    const body = 'data: {"type":"text","text":"Hel"}\n\ndata: {"type":"text","text":"lo"}\n\ndata: {"type":"done"}\n\n'
    const chunks = [body.slice(0, 7), body.slice(7, 30), body.slice(30, 36), body.slice(36, 37), body.slice(37)]
    const { events, final } = await collect(chunks)
    expect(events).toEqual([{ type: 'text', text: 'Hel' }, { type: 'text', text: 'lo' }, { type: 'done' }])
    expect(final).toEqual({ type: 'done' })
  })

  it('splits a multi-byte character across chunks without corrupting it', async () => {
    const bytes = new TextEncoder().encode('data: {"type":"text","text":"café ✓"}\n\ndata: {"type":"done"}\n')
    const cut = bytes.indexOf(0xe2) + 1
    const { events } = await collect([bytes.slice(0, cut), bytes.slice(cut)])
    expect(events[0]).toEqual({ type: 'text', text: 'café ✓' })
  })

  it('ignores blank lines, comments, other fields and malformed data, and handles CRLF', async () => {
    const { events } = await collect([
      ': keep-alive\r\n\r\nevent: message\r\nid: 1\r\ndata: not json\r\ndata: {"type":"mystery"}\r\n',
      'data: {"type":"text","text":"ok"}\r\n\r\ndata: {"type":"done"}\r\n',
    ])
    expect(events).toEqual([{ type: 'text', text: 'ok' }, { type: 'done' }])
  })

  it('reads a final line with no trailing newline', async () => {
    const { final } = await collect(['data: {"type":"text","text":"a"}\n', 'data: {"type":"error","message":"boom"}'])
    expect(final).toEqual({ type: 'error', message: 'boom' })
  })

  it('returns null when the stream ends without done or error', async () => {
    const { events, final } = await collect(['data: {"type":"text","text":"partial"}\n'])
    expect(events).toHaveLength(1)
    expect(final).toBeNull()
  })

  it('stops at the first terminal event', async () => {
    const { events } = await collect(['data: {"type":"done"}\n\ndata: {"type":"text","text":"late"}\n\n'])
    expect(events).toEqual([{ type: 'done' }])
  })
})

const problem = (over: Partial<ProblemContext> = {}): ProblemContext => ({
  kind: 'problem',
  mode: 'practice',
  problemTitle: 'Session Timer',
  difficulty: 'Easy',
  stageNumber: 1,
  stageCount: 3,
  stageTitle: 'Open, close, and count',
  prompt: 'Build it.',
  earlierStages: [],
  code: 'class A: pass',
  ...over,
})

const turns = (n: number, size = 10): ChatMessage[] =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `${i}:`.padEnd(size, 'x') }))

describe('trimRequest', () => {
  it('passes a small request through unchanged', () => {
    const req: TutorRequest = { context: problem(), messages: turns(3) }
    expect(trimRequest(req)).toEqual(req)
  })

  it('drops the oldest messages first and starts on a user turn', () => {
    const out = trimRequest({ context: { kind: 'general' }, messages: turns(LIMITS.messages + 6) })
    expect(out.messages.length).toBeLessThanOrEqual(LIMITS.messages)
    expect(out.messages[0].role).toBe('user')
    expect(out.messages.at(-1)!.content).toMatch(new RegExp(`^${LIMITS.messages + 5}:`))
  })

  it('truncates long messages', () => {
    const out = trimRequest({
      context: { kind: 'general' },
      messages: [{ role: 'user', content: 'q'.repeat(LIMITS.messageChars + 10) }],
    })
    expect(out.messages[0].content).toHaveLength(LIMITS.messageChars)
  })

  it('merges back-to-back turns from the same role', () => {
    const out = trimRequest({
      context: { kind: 'general' },
      messages: [
        { role: 'user', content: 'first' },
        { role: 'user', content: 'second' },
      ],
    })
    expect(out.messages).toEqual([{ role: 'user', content: 'first\n\nsecond' }])
  })

  it('drops old messages until the body fits the Worker size cap', () => {
    const out = trimRequest({ context: problem(), messages: turns(LIMITS.messages + 1, LIMITS.messageChars) })
    expect(JSON.stringify(out).length).toBeLessThan(LIMITS.bodyBytes)
    expect(out.messages.at(-1)!.role).toBe('user')
    expect(out.messages[0].role).toBe('user')
  })
})

describe('streamTutor', () => {
  afterEach(() => vi.unstubAllGlobals())

  const run = async (response: Response | Error, signal = new AbortController().signal) => {
    const fetchMock = vi.fn(async () => {
      if (response instanceof Error) throw response
      return response
    })
    vi.stubGlobal('fetch', fetchMock)
    const events: TutorEvent[] = []
    await streamTutor({ context: { kind: 'general' }, messages: [{ role: 'user', content: 'hi' }] }, (e) => events.push(e), signal)
    return { events, fetchMock }
  }

  const sse = (body: string, status = 200) =>
    new Response(body, { status, headers: { 'content-type': 'text/event-stream; charset=utf-8' } })

  it('posts the trimmed request and streams events', async () => {
    const { events, fetchMock } = await run(sse('data: {"type":"text","text":"Hi"}\n\ndata: {"type":"done"}\n\n'))
    expect(events).toEqual([{ type: 'text', text: 'Hi' }, { type: 'done' }])
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/tutor')
    expect(JSON.parse(init.body as string)).toEqual({ context: { kind: 'general' }, messages: [{ role: 'user', content: 'hi' }] })
  })

  it('maps 429 to the rate-limit message', async () => {
    const { events } = await run(Response.json({ error: 'Too many' }, { status: 429 }))
    expect(events).toEqual([{ type: 'error', message: RATE_LIMITED }])
  })

  it('shows the server’s JSON error sentence for other failures', async () => {
    const message = 'Today’s free Workers AI allowance for this site is used up. It resets at 00:00 UTC.'
    const { events } = await run(Response.json({ error: message }, { status: 502 }))
    expect(events).toEqual([{ type: 'error', message }])
  })

  it('falls back to its own message when the error body is not JSON', async () => {
    const { events } = await run(new Response('<html>Bad gateway</html>', { status: 502 }))
    expect(events).toEqual([{ type: 'error', message: 'The teacher is unavailable right now. Try again in a moment.' }])
  })

  it('reads an error event from a 5xx event stream', async () => {
    const { events } = await run(sse('data: {"type":"error","message":"Model down."}\n\n', 502))
    expect(events).toEqual([{ type: 'error', message: 'Model down.' }])
  })

  it('reports a cut-off answer when the stream ends early', async () => {
    const { events } = await run(sse('data: {"type":"text","text":"Hal"}\n\n'))
    expect(events.at(-1)).toEqual({ type: 'error', message: 'The answer stopped early. Try again.' })
  })

  it('reports a network failure', async () => {
    const { events } = await run(new TypeError('Failed to fetch'))
    expect(events).toEqual([{ type: 'error', message: 'Couldn’t reach the teacher. Check your connection and try again.' }])
  })

  it('stays silent when aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const { events } = await run(new DOMException('Aborted', 'AbortError'), controller.signal)
    expect(events).toEqual([])
  })
})
