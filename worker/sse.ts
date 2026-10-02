import type { TutorEvent } from '../src/tutor/protocol'

const encoder = new TextEncoder()

export const encodeEvent = (event: TutorEvent): Uint8Array => encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

/** Pull the answer text out of one upstream chunk. Reasoning tokens are deliberately dropped. */
function textOf(chunk: unknown): string {
  if (typeof chunk !== 'object' || chunk === null) return ''
  const c = chunk as { response?: unknown; choices?: { delta?: { content?: unknown } }[] }
  const delta = c.choices?.[0]?.delta?.content
  if (typeof delta === 'string') return delta
  return typeof c.response === 'string' ? c.response : ''
}

/**
 * Converts a Workers AI text-generation SSE stream (OpenAI chat-completion chunks, or the
 * legacy `{ response }` shape) into our model-agnostic TutorEvent stream.
 */
export function toTutorEvents(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith('data:')) return
    const data = line.slice(5).trim()
    if (!data) return
    if (data === '[DONE]') {
      if (!finished) controller.enqueue(encodeEvent({ type: 'done' }))
      finished = true
      return
    }
    try {
      const text = textOf(JSON.parse(data))
      if (text) controller.enqueue(encodeEvent({ type: 'text', text }))
    } catch {
      // A malformed chunk is skipped rather than failing the whole answer.
    }
  }

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(bytes, controller) {
        buffer += decoder.decode(bytes, { stream: true })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''
        for (const line of lines) handleLine(line, controller)
      },
      flush(controller) {
        buffer += decoder.decode()
        if (buffer) handleLine(buffer, controller)
        if (!finished) controller.enqueue(encodeEvent({ type: 'done' }))
      },
    }),
  )
}
