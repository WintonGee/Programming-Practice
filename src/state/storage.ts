/** localStorage access that never throws: private mode, quota and disabled storage all degrade to no-ops. */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  /** Returns false when the value could not be persisted (storage full or unavailable). */
  setItem(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
}

/** One in-memory snapshot, mirrored to localStorage on every change and reloaded when another tab writes the key. */
export function createStoredStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (s: T) => string,
): { read: () => T; update: (fn: (s: T) => T) => boolean; subscribe: (l: () => void) => () => void } {
  let snapshot: T | null = null
  let lastWriteOk = true
  const listeners = new Set<() => void>()

  const read = (): T => {
    if (snapshot === null) snapshot = parse(safeStorage.getItem(key))
    return snapshot
  }

  const emit = () => {
    for (const l of listeners) l()
  }

  const update = (fn: (s: T) => T): boolean => {
    const prev = read()
    const next = fn(prev)
    if (next === prev) return lastWriteOk
    snapshot = next
    lastWriteOk = safeStorage.setItem(key, serialize(next))
    emit()
    return lastWriteOk
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== key) return
      snapshot = parse(event.newValue)
      emit()
    })
  }

  return { read, update, subscribe }
}
