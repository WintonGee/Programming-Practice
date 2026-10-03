import { describe, expect, it } from 'vitest'
import { countTests, parseProblems, type ProblemFiles } from './parse'

const stage = (slug: string, n: number, extra: Partial<Record<string, string>> = {}): ProblemFiles => ({
  [`${slug}/stages/${n}/stage.json`]: JSON.stringify({ title: `Stage ${n}`, hints: [`hint ${n}`] }),
  [`${slug}/stages/${n}/prompt.md`]: `Prompt ${n}`,
  [`${slug}/stages/${n}/tests.py`]: `def test_${n}(): pass`,
  [`${slug}/stages/${n}/solution.py`]: `# solution ${n}`,
  ...(extra as ProblemFiles),
})

const problem = (slug: string, meta: Record<string, unknown>, stages: number[]): ProblemFiles =>
  Object.assign(
    {
      [`${slug}/problem.json`]: JSON.stringify({
        title: slug,
        difficulty: 'Medium',
        order: 1,
        tags: ['Design'],
        summary: 'Summary',
        estimatedMinutes: 60,
        ...meta,
      }),
      [`${slug}/starter.py`]: 'class X: ...',
    },
    ...stages.map((n) => stage(slug, n)),
  )

describe('parseProblems', () => {
  it('assembles problem metadata, starter and stages in numeric order', () => {
    const [p] = parseProblems(problem('timer', { title: 'Timer' }, [2, 1, 10, 3, 4, 5, 6, 7, 8, 9]))
    expect(p.slug).toBe('timer')
    expect(p.title).toBe('Timer')
    expect(p.starter).toBe('class X: ...')
    expect(p.stages.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(p.stages[0]).toEqual({
      number: 1,
      title: 'Stage 1',
      hints: ['hint 1'],
      prompt: 'Prompt 1',
      tests: 'def test_1(): pass',
      solution: '# solution 1',
    })
  })

  it('sorts problems by order', () => {
    const files = {
      ...problem('b', { order: 2 }, [1]),
      ...problem('a', { order: 3 }, [1]),
      ...problem('c', { order: 1 }, [1]),
    }
    expect(parseProblems(files).map((p) => p.slug)).toEqual(['c', 'b', 'a'])
  })

  it('ignores directories without problem.json', () => {
    const files = { ...problem('a', {}, [1]), ...stage('draft', 1) }
    expect(parseProblems(files).map((p) => p.slug)).toEqual(['a'])
  })

  it('does not mix stages from slugs sharing a prefix', () => {
    const files = { ...problem('db', {}, [1]), ...problem('db-two', {}, [1, 2]) }
    const bySlug = Object.fromEntries(parseProblems(files).map((p) => [p.slug, p.stages.length]))
    expect(bySlug).toEqual({ db: 1, 'db-two': 2 })
  })

  it('rejects an invalid difficulty', () => {
    expect(() => parseProblems(problem('a', { difficulty: 'Brutal' }, [1]))).toThrow(/invalid difficulty/)
  })

  it('rejects gaps in stage numbering', () => {
    expect(() => parseProblems(problem('a', {}, [1, 3]))).toThrow(/numbered 1..N/)
  })

  it('rejects a problem with no stages', () => {
    expect(() => parseProblems(problem('a', {}, []))).toThrow(/no stages/)
  })

  it('names a missing problem.json key', () => {
    const files = problem('a', {}, [1])
    const { summary: _, ...meta } = JSON.parse(files['a/problem.json'])
    files['a/problem.json'] = JSON.stringify(meta)
    expect(() => parseProblems(files)).toThrow('problem "a" is missing "summary" in problem.json')
  })

  it('rejects a stage without hints', () => {
    const files = problem('a', {}, [1])
    files['a/stages/1/stage.json'] = JSON.stringify({ title: 'Stage 1', hints: [] })
    expect(() => parseProblems(files)).toThrow('problem "a" stage 1 needs a title and non-empty hints')
  })

  it('names the missing file', () => {
    const files = problem('a', {}, [1])
    delete files['a/stages/1/tests.py']
    expect(() => parseProblems(files)).toThrow('problem "a" is missing stages/1/tests.py')
  })
})

describe('countTests', () => {
  it('counts top-level test functions only', () => {
    expect(countTests('def test_a():\n    pass\n\ndef _helper():\n    pass\n\ndef test_b():\n    pass\n')).toBe(2)
  })
})
