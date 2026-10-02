import { describe, expect, it } from 'vitest'
import { appendMessage, clearThread, emptyHistory, MAX_THREAD_MESSAGES, parseHistory, type StoredMessage } from './history'

const msg = (i: number): StoredMessage => ({ id: `m${i}`, role: i % 2 === 0 ? 'user' : 'assistant', content: `#${i}` })

describe('parseHistory', () => {
  it('returns an empty history for missing, corrupt or foreign data', () => {
    expect(parseHistory(null)).toEqual(emptyHistory())
    expect(parseHistory('{not json')).toEqual(emptyHistory())
    expect(parseHistory('{"version":2,"threads":{}}')).toEqual(emptyHistory())
    expect(parseHistory('null')).toEqual(emptyHistory())
  })

  it('drops malformed messages and caps each thread', () => {
    const list = [...Array.from({ length: 50 }, (_, i) => msg(i)), { id: 'x', role: 'system', content: 'no' }, 42]
    const parsed = parseHistory(JSON.stringify({ version: 1, threads: { p: list, q: 'nope' } }))
    expect(parsed.threads.p).toHaveLength(MAX_THREAD_MESSAGES)
    expect(parsed.threads.p.at(-1)).toEqual(msg(49))
    expect(parsed.threads.q).toBeUndefined()
  })
})

describe('appendMessage', () => {
  it('appends to one thread without touching others', () => {
    let s = appendMessage(emptyHistory(), 'general', msg(0))
    s = appendMessage(s, 'session-timer', msg(1))
    expect(s.threads.general).toEqual([msg(0)])
    expect(s.threads['session-timer']).toEqual([msg(1)])
  })

  it('keeps only the newest 40 messages', () => {
    let s = emptyHistory()
    for (let i = 0; i < 45; i++) s = appendMessage(s, 't', msg(i))
    expect(s.threads.t).toHaveLength(40)
    expect(s.threads.t[0]).toEqual(msg(5))
  })
})

describe('clearThread', () => {
  it('removes one thread and is a no-op for unknown threads', () => {
    const s = appendMessage(appendMessage(emptyHistory(), 'a', msg(0)), 'b', msg(1))
    expect(clearThread(s, 'a').threads).toEqual({ b: [msg(1)] })
    expect(clearThread(s, 'zzz')).toBe(s)
  })
})
