import type { Difficulty, Problem, Stage } from '../types'

const DIFFICULTIES: readonly Difficulty[] = ['Easy', 'Medium', 'Hard']

/** Raw file contents keyed by path relative to the problems directory, e.g. "session-timer/stages/1/tests.py". */
export type ProblemFiles = Record<string, string>

export function parseProblems(files: ProblemFiles): Problem[] {
  const slugs = new Set<string>()
  for (const path of Object.keys(files)) {
    const [slug, file] = path.split('/')
    if (file === 'problem.json') slugs.add(slug)
  }
  return [...slugs].map((slug) => parseProblem(slug, files)).sort((a, b) => a.order - b.order)
}

function parseProblem(slug: string, files: ProblemFiles): Problem {
  const need = (rel: string): string => {
    const content = files[`${slug}/${rel}`]
    if (content === undefined) throw new Error(`problem "${slug}" is missing ${rel}`)
    return content
  }
  const meta = JSON.parse(need('problem.json')) as Omit<Problem, 'slug' | 'starter' | 'stages'>
  if (!DIFFICULTIES.includes(meta.difficulty)) {
    throw new Error(`problem "${slug}" has invalid difficulty "${meta.difficulty}"`)
  }

  const stageNumbers = new Set<number>()
  for (const path of Object.keys(files)) {
    const match = path.match(new RegExp(`^${slug}/stages/(\\d+)/`))
    if (match) stageNumbers.add(Number(match[1]))
  }
  const sorted = [...stageNumbers].sort((a, b) => a - b)
  sorted.forEach((n, i) => {
    if (n !== i + 1) throw new Error(`problem "${slug}" stages must be numbered 1..N`)
  })

  const stages: Stage[] = sorted.map((number) => {
    const dir = `stages/${number}`
    const stageMeta = JSON.parse(need(`${dir}/stage.json`)) as { title: string; hints: string[] }
    return {
      number,
      title: stageMeta.title,
      hints: stageMeta.hints,
      prompt: need(`${dir}/prompt.md`),
      tests: need(`${dir}/tests.py`),
      solution: need(`${dir}/solution.py`),
    }
  })
  if (stages.length === 0) throw new Error(`problem "${slug}" has no stages`)

  return {
    slug,
    title: meta.title,
    difficulty: meta.difficulty,
    order: meta.order,
    tags: meta.tags,
    summary: meta.summary,
    estimatedMinutes: meta.estimatedMinutes,
    starter: need('starter.py'),
    stages,
  }
}
