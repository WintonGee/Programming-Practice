import { LIMITS, TUTOR_ENDPOINT, type TutorRequest } from '../src/tutor/protocol'
import { buildSystemPrompt } from './prompt'
import { toTutorEvents } from './sse'
import { InvalidRequest, parseTutorRequest } from './validate'

const MAX_ANSWER_TOKENS = 1_500

const json = (status: number, error: string) => Response.json({ error }, { status })

function log(level: 'info' | 'warn' | 'error', message: string, fields: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ message, ...fields }))
}

/** Errors that mean "this model isn't available to this account", so a fallback model should be tried. */
export const isUnavailable = (err: unknown): boolean => /\b(403|5035|5007|5018)\b|paid plan|not found|no such model/i.test(String(err))

/**
 * Every model call goes through AI Gateway for logs, analytics, retries, and caching.
 * The `default` gateway is created automatically on first use.
 */
export function gatewayOptions(env: Pick<Env, 'TUTOR_GATEWAY'>, req: TutorRequest): GatewayOptions {
  const c = req.context
  // Only a one-shot general question is safe to cache: the same question always deserves the same
  // answer, while a follow-up or a retried problem question should get a fresh one.
  const cacheable = c.kind === 'general' && req.messages.length === 1
  return {
    id: env.TUTOR_GATEWAY,
    ...(cacheable ? { cacheTtl: 7 * 24 * 60 * 60 } : { skipCache: true }),
    requestTimeoutMs: 60_000,
    retries: { maxAttempts: 2, retryDelayMs: 500, backoff: 'exponential' },
    metadata:
      c.kind === 'problem'
        ? { app: 'staged', context: 'problem', mode: c.mode, problem: c.problemTitle, stage: c.stageNumber }
        : { app: 'staged', context: 'general' },
  }
}

export function modelErrorMessage(err: unknown): string {
  return /\b4006\b|daily free allocation/i.test(String(err))
    ? "Today's free Workers AI allowance for this site is used up. It resets at 00:00 UTC (or upgrade the Cloudflare account to Workers Paid)."
    : 'The teacher is unavailable right now. Try again in a moment.'
}

async function runModel(env: Env, req: TutorRequest): Promise<{ model: string; stream: ReadableStream<Uint8Array> }> {
  const messages = [{ role: 'system' as const, content: buildSystemPrompt(req.context) }, ...req.messages]
  const gateway = gatewayOptions(env, req)
  const attempt = async (model: string, extra: Record<string, unknown>) =>
    (await env.AI.run(
      model as keyof AiModels,
      {
        messages,
        stream: true,
        max_completion_tokens: MAX_ANSWER_TOKENS,
        temperature: 0.3,
        ...extra,
      } as never,
      { gateway },
    )) as unknown as ReadableStream<Uint8Array>

  try {
    // Low reasoning effort keeps a chat reply fast; the tutor's answers are short.
    return { model: env.TUTOR_MODEL, stream: await attempt(env.TUTOR_MODEL, { reasoning_effort: 'low' }) }
  } catch (err) {
    if (!isUnavailable(err) || env.TUTOR_FALLBACK_MODEL === env.TUTOR_MODEL) throw err
    log('warn', 'primary tutor model unavailable; using fallback', { model: env.TUTOR_MODEL, error: String(err) })
    // Thinking off: measured ~1.5s to first token with answers as accurate as with thinking (~15s).
    return {
      model: env.TUTOR_FALLBACK_MODEL,
      stream: await attempt(env.TUTOR_FALLBACK_MODEL, { chat_template_kwargs: { enable_thinking: false } }),
    }
  }
}

async function handleTutor(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json(405, 'Use POST.')

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const { success } = await env.TUTOR_LIMITER.limit({ key: ip })
  if (!success) return json(429, 'Too many questions in a short time. Wait a minute and try again.')

  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > LIMITS.bodyBytes) return json(413, 'That request is too large.')
  const raw = await request.text()
  if (raw.length > LIMITS.bodyBytes) return json(413, 'That request is too large.')

  let req: TutorRequest
  try {
    req = parseTutorRequest(JSON.parse(raw))
  } catch (err) {
    return json(400, err instanceof InvalidRequest ? err.message : 'The request body must be JSON.')
  }

  const started = Date.now()
  try {
    const { model, stream } = await runModel(env, req)
    log('info', 'tutor answer started', { model, context: req.context.kind, turns: req.messages.length, ms: Date.now() - started })
    return new Response(toTutorEvents(stream), {
      headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store' },
    })
  } catch (err) {
    log('error', 'tutor model failed', { error: String(err), ms: Date.now() - started })
    return json(502, modelErrorMessage(err))
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === TUTOR_ENDPOINT) return handleTutor(request, env)
    if (pathname.startsWith('/api/')) return json(404, 'Not found.')
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
