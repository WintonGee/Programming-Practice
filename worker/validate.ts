import { LIMITS, type ChatMessage, type LastRun, type ProblemContext, type TutorRequest } from '../src/tutor/protocol'

export class InvalidRequest extends Error {}

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function str(o: Obj, key: string, max: number): string {
  const v = o[key]
  if (typeof v !== 'string') throw new InvalidRequest(`"${key}" must be a string`)
  if (v.length > max) throw new InvalidRequest(`"${key}" is too long`)
  return v
}

function int(o: Obj, key: string): number {
  const v = o[key]
  if (!Number.isInteger(v)) throw new InvalidRequest(`"${key}" must be an integer`)
  return v as number
}

function messages(v: unknown): ChatMessage[] {
  if (!Array.isArray(v) || v.length === 0) throw new InvalidRequest('"messages" must be a non-empty array')
  if (v.length > LIMITS.messages) throw new InvalidRequest('too many messages')
  const out = v.map((m): ChatMessage => {
    if (!isObj(m) || (m.role !== 'user' && m.role !== 'assistant')) throw new InvalidRequest('invalid message')
    const content = str(m, 'content', LIMITS.messageChars)
    return { role: m.role, content }
  })
  if (out[out.length - 1].role !== 'user') throw new InvalidRequest('the last message must be from the user')
  if (!out[out.length - 1].content.trim()) throw new InvalidRequest('the question is empty')
  return out
}

function lastRun(v: unknown): LastRun | undefined {
  if (v === undefined) return undefined
  if (!isObj(v) || !Array.isArray(v.failures)) throw new InvalidRequest('invalid "lastRun"')
  return {
    summary: str(v, 'summary', LIMITS.summaryChars),
    loadError: v.loadError === undefined ? undefined : str(v, 'loadError', LIMITS.loadErrorChars),
    failures: v.failures.slice(0, LIMITS.failures).map((f) => {
      if (!isObj(f)) throw new InvalidRequest('invalid failure')
      return {
        stage: int(f, 'stage'),
        name: str(f, 'name', LIMITS.failureNameChars),
        doc: str(f, 'doc', LIMITS.failureDocChars),
        message: str(f, 'message', LIMITS.failureMessageChars),
        code: str(f, 'code', LIMITS.failureCodeChars),
      }
    }),
  }
}

function problem(c: Obj): ProblemContext {
  if (c.mode !== 'practice' && c.mode !== 'interview') throw new InvalidRequest('invalid "mode"')
  const earlier = c.earlierStages
  if (!Array.isArray(earlier) || earlier.some((t) => typeof t !== 'string' || t.length > LIMITS.titleChars) || earlier.length > LIMITS.earlierStages) {
    throw new InvalidRequest('invalid "earlierStages"')
  }
  return {
    kind: 'problem',
    mode: c.mode,
    problemTitle: str(c, 'problemTitle', LIMITS.titleChars),
    difficulty: str(c, 'difficulty', LIMITS.difficultyChars),
    stageNumber: int(c, 'stageNumber'),
    stageCount: int(c, 'stageCount'),
    stageTitle: str(c, 'stageTitle', LIMITS.titleChars),
    prompt: str(c, 'prompt', LIMITS.promptChars),
    earlierStages: earlier as string[],
    code: str(c, 'code', LIMITS.codeChars),
    lastRun: lastRun(c.lastRun),
  }
}

/** Parse and bound an untrusted request body. Throws InvalidRequest with a client-safe message. */
export function parseTutorRequest(body: unknown): TutorRequest {
  if (!isObj(body) || !isObj(body.context)) throw new InvalidRequest('expected { context, messages }')
  const context = body.context.kind === 'general' ? ({ kind: 'general' } as const) : body.context.kind === 'problem' ? problem(body.context) : null
  if (!context) throw new InvalidRequest('invalid "context.kind"')
  return { context, messages: messages(body.messages) }
}
