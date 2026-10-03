import { useSyncExternalStore } from 'react'
import { createStoredStore } from '../state/storage'
import type { ChatMessage } from './protocol'

export const HISTORY_KEY = 'staged:tutor:v1'
export const MAX_THREAD_MESSAGES = 40
export const GENERAL_THREAD = 'general'

export interface StoredMessage extends ChatMessage {
  id: string
}

export interface HistoryState {
  version: 1
  /** Thread id (problem slug, or `general`) to its messages, oldest first. */
  threads: Record<string, StoredMessage[]>
}

const EMPTY: StoredMessage[] = []

export const emptyHistory = (): HistoryState => ({ version: 1, threads: {} })

const isMessage = (m: unknown): m is StoredMessage => {
  if (typeof m !== 'object' || m === null) return false
  const v = m as Record<string, unknown>
  return typeof v.id === 'string' && (v.role === 'user' || v.role === 'assistant') && typeof v.content === 'string'
}

/** Never throws: corrupt or foreign data becomes an empty history, and bad messages are dropped. */
export function parseHistory(raw: string | null): HistoryState {
  if (!raw) return emptyHistory()
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; threads?: unknown }
    if (parsed?.version !== 1 || typeof parsed.threads !== 'object' || parsed.threads === null) return emptyHistory()
    const threads: Record<string, StoredMessage[]> = {}
    for (const [id, list] of Object.entries(parsed.threads as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue
      const messages = list.filter(isMessage).slice(-MAX_THREAD_MESSAGES)
      if (messages.length > 0) threads[id] = messages
    }
    return { version: 1, threads }
  } catch {
    return emptyHistory()
  }
}

export function appendMessage(state: HistoryState, thread: string, message: StoredMessage): HistoryState {
  const messages = [...(state.threads[thread] ?? []), message].slice(-MAX_THREAD_MESSAGES)
  return { ...state, threads: { ...state.threads, [thread]: messages } }
}

export function clearThread(state: HistoryState, thread: string): HistoryState {
  if (!state.threads[thread]) return state
  const threads = { ...state.threads }
  delete threads[thread]
  return { ...state, threads }
}

const store = createStoredStore(HISTORY_KEY, parseHistory, JSON.stringify)

export function updateHistory(fn: (state: HistoryState) => HistoryState) {
  store.update(fn)
}

export const getThread = (thread: string): StoredMessage[] => store.read().threads[thread] ?? EMPTY

export function useThread(thread: string): StoredMessage[] {
  return useSyncExternalStore(
    store.subscribe,
    () => getThread(thread),
    () => EMPTY,
  )
}
