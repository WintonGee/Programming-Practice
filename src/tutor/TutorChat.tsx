import { ArrowUp, CircleAlert, GraduationCap, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { InlineConfirm } from '../components/InlineConfirm'
import { Markdown } from '../components/Markdown'
import { streamTutor } from './client'
import { emptyState, type ChatScope } from './context'
import { appendMessage, clearThread, getThread, updateHistory, useThread } from './history'
import type { TutorRequest } from './protocol'

interface Props {
  /** Problem slug, or `general`. */
  thread: string
  /** Called at send time so the teacher sees the live editor code and latest run. */
  getContext: () => TutorRequest['context']
  scope: ChatScope
  /** Center the conversation in a reading column (standalone page). */
  wide?: boolean
}

const STICK_THRESHOLD_PX = 48
const MAX_INPUT_PX = 160
const SEND_BUTTON = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-[background-color,border-color,filter] duration-100'

const placeholders = {
  practice: 'Ask about this stage or your code',
  interview: 'Ask your interviewer a question',
  general: 'Ask a programming question',
}

function TypingIndicator() {
  return (
    <span className="inline-flex h-6 items-center gap-1" role="status" aria-label="Teacher is typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  )
}

function AssistantMessage({ children }: { children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
        <GraduationCap size={14} aria-hidden />
        Teacher
      </p>
      {children}
    </div>
  )
}

export function TutorChat({ thread, getContext, scope, wide = false }: Props) {
  const messages = useThread(thread)
  /** Answer text so far while streaming; '' before the first chunk; null when idle. */
  const [streaming, setStreaming] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const stick = useRef(true)

  useEffect(() => () => abort.current?.abort(), [])

  const pinToBottom = () => {
    const el = list.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }

  useLayoutEffect(pinToBottom, [messages, streaming, failure])

  // Markdown reflow, pane resizes and a hidden tab becoming visible all change height without a render.
  useEffect(() => {
    const observer = new ResizeObserver(pinToBottom)
    if (list.current) observer.observe(list.current)
    if (content.current) observer.observe(content.current)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_PX)}px`
  }, [draft])

  const ask = async () => {
    const controller = new AbortController()
    abort.current = controller
    stick.current = true
    setFailure(null)
    setStreaming('')
    const answer = { text: '', error: null as string | null }
    const request: TutorRequest = {
      context: getContext(),
      messages: getThread(thread).map(({ role, content }) => ({ role, content })),
    }
    await streamTutor(
      request,
      (e) => {
        if (e.type === 'text') {
          answer.text += e.text
          setStreaming(answer.text)
        } else if (e.type === 'error') answer.error = e.message
      },
      controller.signal,
    )
    if (abort.current === controller) abort.current = null
    if (answer.error) setFailure(answer.error)
    else if (answer.text) {
      updateHistory((s) => appendMessage(s, thread, { id: crypto.randomUUID(), role: 'assistant', content: answer.text }))
    } else if (controller.signal.aborted) setFailure('You stopped this answer.')
    setStreaming(null)
  }

  const send = (text: string) => {
    const question = text.trim()
    if (!question || streaming !== null) return
    setConfirmClear(false)
    updateHistory((s) => appendMessage(s, thread, { id: crypto.randomUUID(), role: 'user', content: question }))
    setDraft('')
    void ask()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter belongs to the workspace's Run tests shortcut.
    if (e.key !== 'Enter' || e.shiftKey || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    send(draft)
  }

  const clear = () => {
    abort.current?.abort()
    updateHistory((s) => clearThread(s, thread))
    setFailure(null)
    setConfirmClear(false)
    input.current?.focus()
  }

  const busy = streaming !== null
  const empty = messages.length === 0 && !busy && !failure
  const intro = emptyState(scope)
  const column = wide ? 'mx-auto w-full max-w-3xl px-5' : 'px-5 sm:px-6'
  const placeholder = placeholders[scope.kind === 'general' ? 'general' : scope.mode]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={list}
        role="log"
        aria-label="Conversation with the teacher"
        aria-busy={busy}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX
        }}
        className="scroll-pane min-h-0 flex-1"
      >
        <div ref={content} className={`${column} py-6`}>
          {empty ? (
            <div className={wide ? 'pt-6 sm:pt-12' : ''}>
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-raised text-text">
                <GraduationCap size={18} aria-hidden />
              </span>
              <h2 className="mt-3 text-[15px] font-semibold">Ask the teacher</h2>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{intro.intro}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {intro.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] text-text transition-colors hover:border-line-strong hover:bg-raised"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="space-y-6">
              {messages.map((m) => (
                <li key={m.id}>
                  {m.role === 'user' ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-lg border border-line bg-raised px-3.5 py-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <AssistantMessage>
                      <Markdown source={m.content} />
                    </AssistantMessage>
                  )}
                </li>
              ))}
              {busy && (
                <li>
                  <AssistantMessage>
                    {streaming ? <Markdown source={streaming} /> : <TypingIndicator />}
                  </AssistantMessage>
                </li>
              )}
              {failure && (
                <li>
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-fail/40 bg-fail-soft px-4 py-3"
                  >
                    <CircleAlert size={16} className="shrink-0 text-fail" aria-hidden />
                    <p className="min-w-0 flex-1 text-sm text-text">{failure}</p>
                    <Button size="sm" icon={<RotateCcw size={14} aria-hidden />} onClick={() => void ask()}>
                      Retry
                    </Button>
                  </div>
                </li>
              )}
            </ol>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-panel py-3">
        <form onSubmit={onSubmit} className={column}>
          <div className="flex items-end gap-2 rounded-lg border border-line-strong bg-bg py-1.5 pr-1.5 pl-3 transition-colors focus-within:border-focus">
            <textarea
              ref={input}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              aria-label="Message the teacher"
              className="min-h-8 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-text placeholder:text-muted focus-visible:outline-none"
            />
            {busy ? (
              <button
                type="button"
                aria-label="Stop"
                title="Stop"
                onClick={() => abort.current?.abort()}
                className={`${SEND_BUTTON} border border-line-strong bg-raised text-text hover:border-muted`}
              >
                <Square size={12} fill="currentColor" aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                title="Send"
                disabled={!draft.trim()}
                className={`${SEND_BUTTON} bg-amber-fill text-amber-ink hover:brightness-110 disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted disabled:hover:brightness-100`}
              >
                <ArrowUp size={16} strokeWidth={2.5} aria-hidden />
              </button>
            )}
          </div>
          <div className="mt-2 flex min-h-7 items-center gap-3">
            {confirmClear ? (
              <InlineConfirm
                message="Clear this conversation?"
                confirmLabel="Clear"
                onConfirm={clear}
                onCancel={() => setConfirmClear(false)}
              />
            ) : (
              <>
                <p className="min-w-0 flex-1 text-xs text-muted">
                  {scope.kind === 'problem'
                    ? 'The teacher sees this stage’s prompt, your code, and your latest test results.'
                    : 'Enter sends. Shift+Enter adds a new line.'}
                </p>
                {messages.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={13} aria-hidden />}
                    onClick={() => setConfirmClear(true)}
                    aria-label="Clear conversation"
                    title="Clear conversation"
                    className="-mr-2.5"
                  >
                    Clear
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
