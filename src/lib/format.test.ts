import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatMs, formatRelative } from './format'

describe('formatClock', () => {
  it('rolls over to hours and formats negatives by magnitude', () => {
    expect(formatClock(3_600_000)).toBe('1:00:00')
    expect(formatClock(-65_000)).toBe('1:05')
    expect(formatClock(59_999)).toBe('0:59')
  })
})

describe('formatDuration', () => {
  it('rounds to minutes and splits hours', () => {
    expect(formatDuration(29_000)).toBe('under a minute')
    expect(formatDuration(90_000)).toBe('2 min')
    expect(formatDuration(3_600_000)).toBe('1 h')
    expect(formatDuration(4_800_000)).toBe('1 h 20 min')
  })
})

describe('formatMs', () => {
  it('switches precision at 10 seconds', () => {
    expect(formatMs(0.2)).toBe('1 ms')
    expect(formatMs(9_999)).toBe('10.00 s')
    expect(formatMs(10_000)).toBe('10.0 s')
  })
})

describe('formatRelative', () => {
  it('picks minute, hour and day thresholds', () => {
    const now = 1_000_000_000
    expect(formatRelative(now - 59_000, now)).toBe('just now')
    expect(formatRelative(now - 5 * 60_000, now)).toBe('5 minutes ago')
    expect(formatRelative(now - 24 * 3_600_000, now)).toBe('yesterday')
  })
})
