import { clip } from './clip'
import { LIMITS, TUTOR_ENDPOINT, type ChatMessage, type TutorEvent, type TutorRequest } from './protocol'

/** Stay under the Worker's LIMITS.bodyBytes with headroom for JSON escaping. */
const MAX_BODY_BYTES = LIMITS.bodyBytes - 20_000

export const RATE_LIMITED = 'You’re asking quickly — wait a minute and try again.'
const UNAVAILABLE = 'The teacher is unavailable right now. Try again in a moment.'
const OFFLINE = 'Couldn’t reach the teacher. Check your connection and try again.'
const CUT_OFF = 'The answer stopped early. Try again.'

const bodyBytes = (request: TutorRequest) => new TextEncoder().encode(JSON.stringify(request)).length

/** Merge back-to-back turns from the same role (e.g. a question re-asked after a failed answer). */
function mergeTurns(messages: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const m of messages) {
    const prev = out[out.length - 1]
    if (prev && prev.role === m.role) out[out.length - 1] = { role: m.role, content: `${prev.content}\n\n${m.content}` }
    else out.push({ role: m.role, content: m.content })
  }
  return out
}

/** Fit the message history inside LIMITS and the body cap: merge same-role turns, clip each message, drop the oldest first. */
export function trimRequest(request: TutorRequest): TutorRequest {
  let messages = mergeTurns(request.messages)
    .slice(-LIMITS.messages)
    .map((m) => ({ role: m.role, content: clip(m.content, LIMITS.messageChars) }))
  const startAtUser = () => {
    while (messages.length > 1 && messages[0].role !== 'user') messages = messages.slice(1)
  }
  startAtUser()
  let trimmed: TutorRequest = { context: request.context, messages }
  while (messages.length > 1 && bodyBytes(trimmed) > MAX_BODY_BYTES) {
    messages = messages.slice(1)
    startAtUser()
    trimmed = { context: request.context, messages }
  }
  return trimmed
}

function toEvent(data: string): TutorEvent | null {
  try {
    const value = JSON.parse(data) as Partial<TutorEvent> | null
    if (value?.type === 'text' && typeof value.text === 'string') return { type: 'text', text: value.text }
    if (value?.type === 'done') return { type: 'done' }
    if (value?.type === 'error' && typeof value.message === 'string') return { type: 'error', message: value.message }
  } catch {
    // A malformed line is skipped rather than failing the whole answer.
  }
  return null
}

/**
 * Reads a `text/event-stream` body, calling `onEvent` for each `data:` line. Returns the final event
 * (`done` or `error`), or null if the stream ended without one.
 */
export async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (e: TutorEvent) => void,
): Promise<TutorEvent | null> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (line: string): TutorEvent | null => {
    if (!line.startsWith('data:')) return null
    const event = toEvent(line.slice(5).trim())
    if (!event) return null
    onEvent(event)
    return event.type === 'text' ? null : event
  }
  try {
    for (;;) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split(/\r?\n/)
      buffer = done ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        const final = handle(line)
        if (final) return final
      }
      if (done) return null
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/** The server's `error` sentence is shown as is; our own copy covers 429 and bodies without one. */
async function errorMessage(response: Response): Promise<string> {
  if (response.status === 429) return RATE_LIMITED
  const detail = await response
    .json()
    .then((b: { error?: unknown } | null) => (typeof b?.error === 'string' ? b.error.trim() : ''))
    .catch(() => '')
  if (detail) return detail
  return response.status === 400 || response.status === 413 ? 'The teacher couldn’t read that question.' : UNAVAILABLE
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

/** POST a question and stream the answer. Resolves after `done` or `error`; aborting resolves silently. */
export async function streamTutor(
  request: TutorRequest,
  onEvent: (e: TutorEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  try {
    const response = await fetch(TUTOR_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(trimRequest(request)),
      signal,
    })
    const isStream = response.headers.get('content-type')?.includes('text/event-stream') ?? false
    // Upstream model failures arrive as a 5xx carrying an error event; read it like any other stream.
    if (!isStream || !response.body) {
      onEvent({ type: 'error', message: response.ok ? UNAVAILABLE : await errorMessage(response) })
      return
    }
    const final = await readEvents(response.body, onEvent)
    if (!final) onEvent({ type: 'error', message: response.ok ? CUT_OFF : UNAVAILABLE })
  } catch (err) {
    if (signal.aborted || isAbort(err)) return
    onEvent({ type: 'error', message: OFFLINE })
  }
}
