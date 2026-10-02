import { useSyncExternalStore } from 'react'
import { safeStorage } from '../state/storage'
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

// Store: one in-memory snapshot, mirrored to localStorage on every change.

let snapshot: HistoryState | null = null
const listeners = new Set<() => void>()

function read(): HistoryState {
  if (!snapshot) snapshot = parseHistory(safeStorage.getItem(HISTORY_KEY))
  return snapshot
}

export function updateHistory(fn: (state: HistoryState) => HistoryState) {
  const prev = read()
  const next = fn(prev)
  if (next === prev) return
  snapshot = next
  safeStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== HISTORY_KEY) return
    snapshot = parseHistory(event.newValue)
    for (const l of listeners) l()
  })
}

export const getThread = (thread: string): StoredMessage[] => read().threads[thread] ?? EMPTY

export function useThread(thread: string): StoredMessage[] {
  return useSyncExternalStore(
    subscribe,
    () => getThread(thread),
    () => EMPTY,
  )
}
