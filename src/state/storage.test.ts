import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStoredStore } from './storage'

const KEY = 'test:v1'

let items: Map<string, string>
let storageListener: ((event: { key: string | null; newValue: string | null }) => void) | null
let writable: boolean

beforeEach(() => {
  items = new Map()
  storageListener = null
  writable = true
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (!writable) throw new Error('QuotaExceededError')
        items.set(k, v)
      },
    },
    addEventListener: (type: string, l: typeof storageListener) => {
      if (type === 'storage') storageListener = l
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const parse = vi.fn((raw: string | null) => ({ n: raw ? Number(raw) : 0 }))
const serialize = (s: { n: number }) => String(s.n)

describe('createStoredStore', () => {
  it('reads storage lazily, once', () => {
    items.set(KEY, '7')
    parse.mockClear()
    const store = createStoredStore(KEY, parse, serialize)
    expect(parse).not.toHaveBeenCalled()
    expect(store.read()).toEqual({ n: 7 })
    expect(store.read()).toBe(store.read())
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('persists and notifies on change', () => {
    const store = createStoredStore(KEY, parse, serialize)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    expect(store.update((s) => ({ n: s.n + 1 }))).toBe(true)
    expect(items.get(KEY)).toBe('1')
    expect(store.read()).toEqual({ n: 1 })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.update((s) => ({ n: s.n + 1 }))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('returns the previous write result for a no-op update without writing or notifying', () => {
    const store = createStoredStore(KEY, parse, serialize)
    const listener = vi.fn()
    store.subscribe(listener)
    writable = false
    expect(store.update((s) => ({ n: s.n + 1 }))).toBe(false)
    writable = true
    expect(store.update((s) => s)).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(items.has(KEY)).toBe(false)
  })

  it('reloads on a storage event for its key only', () => {
    const store = createStoredStore(KEY, parse, serialize)
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.read()).toEqual({ n: 0 })
    storageListener?.({ key: 'other', newValue: '3' })
    expect(store.read()).toEqual({ n: 0 })
    expect(listener).not.toHaveBeenCalled()
    storageListener?.({ key: KEY, newValue: '5' })
    expect(store.read()).toEqual({ n: 5 })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
