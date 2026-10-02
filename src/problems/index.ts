import type { Problem } from '../types'
import { parseProblems } from './parse'

const raw = import.meta.glob('/problems/*/**/*.{json,md,py}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const files = Object.fromEntries(
  Object.entries(raw).map(([path, content]) => [path.replace(/^\/problems\//, ''), content]),
)

export const problems: Problem[] = parseProblems(files)

export function getProblem(slug: string): Problem | undefined {
  return problems.find((p) => p.slug === slug)
}
