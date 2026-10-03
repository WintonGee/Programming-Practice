import { describe, expect, it } from 'vitest'
import { clip, TRUNCATED } from './clip'

describe('clip', () => {
  it('leaves short text alone and truncates long text to the limit with a marker', () => {
    expect(clip('abc', 5)).toBe('abc')
    const out = clip('a'.repeat(100), 50)
    expect(out).toHaveLength(50)
    expect(out.endsWith(TRUNCATED)).toBe(true)
  })
})
