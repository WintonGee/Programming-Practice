import { describe, expect, it } from 'vitest'
import type { TestResult, TestStatus } from '../types'
import { allTestsPassed, passCount } from './types'

const result = (name: string, status: TestStatus): TestResult => ({
  stage: 1,
  name,
  doc: '',
  status,
  message: '',
  line: null,
  code: '',
  frames: [],
  stdout: '',
  ms: 1,
})

const ok = (results: TestResult[]) => ({ kind: 'ok' as const, loadError: null, results, ms: 1 })

describe('allTestsPassed', () => {
  it('is false for an empty result set', () => {
    expect(allTestsPassed(ok([]))).toBe(false)
  })

  it('is false when the code did not load', () => {
    expect(allTestsPassed({ ...ok([result('a', 'pass')]), loadError: { message: 'SyntaxError' } })).toBe(false)
  })

  it('is false for a run that did not finish', () => {
    expect(allTestsPassed({ kind: 'timeout', ms: 1 })).toBe(false)
    expect(allTestsPassed({ kind: 'crash', message: 'boom' })).toBe(false)
  })

  it('is true when every test passes', () => {
    expect(allTestsPassed(ok([result('a', 'pass'), result('b', 'pass')]))).toBe(true)
  })

  it('is false for a mix, which passCount counts', () => {
    const results = [result('a', 'pass'), result('b', 'fail'), result('c', 'pass')]
    expect(allTestsPassed(ok(results))).toBe(false)
    expect(passCount(results)).toBe(2)
  })
})
