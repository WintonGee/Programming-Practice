import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadPyodide } from 'pyodide'
import { beforeAll, describe, expect, it } from 'vitest'
import type { LoadError, TestResult } from '../../types'

type Run = { loadError: LoadError | null; results: TestResult[] }

let runTests: (code: string, suites: string) => string
let runFile: (code: string) => string

beforeAll(async () => {
  const pyodide = await loadPyodide()
  for (const f of ['harness.py', 'runner.py']) {
    pyodide.FS.writeFile(`/home/pyodide/${f}`, readFileSync(join(import.meta.dirname, f), 'utf8'))
  }
  pyodide.runPython('import sys; sys.path.insert(0, "/home/pyodide")')
  runTests = pyodide.runPython('from runner import run_tests; run_tests')
  runFile = pyodide.runPython('from runner import run_file; run_file')
}, 60_000)

const run = (code: string, ...sources: string[]): Run =>
  JSON.parse(runTests(code, JSON.stringify(sources.map((source, i) => ({ stage: i + 1, source })))))

describe('run_tests', () => {
  it('reports both sides of a failed equality assert', () => {
    const out = run('def f(): return 7', 'from solution import f\ndef test_a():\n    """Doc line."""\n    assert f() == 10\n')
    expect(out.results).toHaveLength(1)
    expect(out.results[0]).toMatchObject({
      status: 'fail',
      message: 'expected 10, got 7',
      doc: 'Doc line.',
      line: 4,
      code: 'assert f() == 10',
    })
  })

  it('isolates module state between tests', () => {
    const code = 'items = []\ndef add(x):\n    items.append(x)\n    return len(items)'
    const tests = 'from solution import add\ndef test_one():\n    assert add(1) == 1\ndef test_two():\n    assert add(2) == 1\n'
    expect(run(code, tests).results.map((r) => r.status)).toEqual(['pass', 'pass'])
  })

  it('runs tests in definition order and skips helpers', () => {
    const tests = 'def _helper():\n    return 1\ndef test_b():\n    pass\ndef test_a():\n    pass\n'
    expect(run('', tests).results.map((r) => r.name)).toEqual(['test_b', 'test_a'])
  })

  it('labels results with their stage', () => {
    const out = run('', 'def test_x():\n    pass\n', 'def test_y():\n    assert 1 == 2\n')
    expect(out.results.map((r) => [r.stage, r.status])).toEqual([[1, 'pass'], [2, 'fail']])
  })

  it('treats NotImplementedError as an unfinished failure', () => {
    const out = run('def f():\n    raise NotImplementedError', 'from solution import f\ndef test_a():\n    f()\n')
    expect(out.results[0].status).toBe('fail')
    expect(out.results[0].message).toMatch(/Not implemented yet/)
  })

  it('reports exceptions with solution frames', () => {
    const out = run('def f():\n    return {}["k"]', 'from solution import f\ndef test_a():\n    f()\n')
    expect(out.results[0].status).toBe('error')
    expect(out.results[0].message).toBe("KeyError: 'k'")
    expect(out.results[0].frames.map((f) => [f.file, f.line])).toEqual([
      ['stage1_tests.py', 3],
      ['solution.py', 2],
    ])
  })

  it('captures stdout per test', () => {
    const out = run('', 'def test_a():\n    print("hi")\n')
    expect(out.results[0].stdout).toBe('hi\n')
  })

  it('returns a load error for syntax errors', () => {
    const out = run('def f(:\n  pass', 'def test_a():\n    pass\n')
    expect(out.results).toEqual([])
    expect(out.loadError?.message).toMatch(/^SyntaxError/)
    expect(out.loadError?.line).toBe(1)
  })

  it('returns a load error when import-time code raises', () => {
    const out = run('raise RuntimeError("boom")', 'def test_a():\n    pass\n')
    expect(out.loadError?.message).toBe('RuntimeError: boom')
  })

  it('supports the raises helper', () => {
    const tests =
      'from harness import raises\n' +
      'def test_ok():\n    with raises(KeyError):\n        {}["x"]\n' +
      'def test_none():\n    with raises(KeyError):\n        pass\n' +
      'def test_wrong():\n    with raises(KeyError):\n        raise ValueError("v")\n'
    const [ok, none, wrong] = run('', tests).results
    expect(ok.status).toBe('pass')
    expect(none).toMatchObject({ status: 'fail', message: 'expected KeyError to be raised, but nothing was raised' })
    expect(wrong.message).toBe('expected KeyError to be raised, but got ValueError: v')
  })
})

describe('run_file', () => {
  it('runs code as __main__ and captures output', () => {
    const out = JSON.parse(runFile('if __name__ == "__main__":\n    print("main")'))
    expect(out).toMatchObject({ stdout: 'main\n', error: null })
  })

  it('reports runtime errors with frames', () => {
    const out = JSON.parse(runFile('print("before")\n1 / 0'))
    expect(out.stdout).toBe('before\n')
    expect(out.error.message).toBe('ZeroDivisionError: division by zero')
    expect(out.error.frames[0].line).toBe(2)
  })
})
