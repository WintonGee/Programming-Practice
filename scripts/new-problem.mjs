// Scaffolds a new staged problem with placeholder files for an author (human or Claude) to fill in.
// Usage: node scripts/new-problem.mjs <slug> --title "Parking Lot" --class ParkingLot [--stages 4] [--difficulty Medium]
// Placeholders contain TODO(author); `pnpm verify:problems` fails until every one is replaced.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problemsDir = join(root, 'problems')

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    class: { type: 'string' },
    stages: { type: 'string', default: '4' },
    difficulty: { type: 'string', default: 'Medium' },
  },
})

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

const slug = positionals[0]
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail('usage: new-problem <kebab-case-slug> --title "..." --class ClassName')
if (!values.title) fail('--title is required')
if (!values.class || !/^[A-Z][A-Za-z0-9]*$/.test(values.class)) fail('--class must be a PascalCase Python class name')
if (!['Easy', 'Medium', 'Hard'].includes(values.difficulty)) fail('--difficulty must be Easy, Medium, or Hard')
const stageCount = Number(values.stages)
if (!Number.isInteger(stageCount) || stageCount < 2 || stageCount > 5) fail('--stages must be 2-5')

const dir = join(problemsDir, slug)
if (existsSync(dir)) fail(`problems/${slug} already exists`)

const nextOrder =
  Math.max(
    0,
    ...readdirSync(problemsDir)
      .filter((s) => existsSync(join(problemsDir, s, 'problem.json')))
      .map((s) => JSON.parse(readFileSync(join(problemsDir, s, 'problem.json'), 'utf8')).order),
  ) + 1

const cls = values.class
const TODO = 'TODO(author)'

const files = {
  'problem.json': `${JSON.stringify(
    {
      title: values.title,
      difficulty: values.difficulty,
      order: nextOrder,
      tags: ['Design', `${TODO}: tags`],
      summary: `${TODO}: one or two sentences hinting at how the problem evolves.`,
      estimatedMinutes: stageCount * 20,
    },
    null,
    2,
  )}\n`,
  'starter.py': `class ${cls}:
    def __init__(self) -> None:
        raise NotImplementedError

    # ${TODO}: stage-1 methods, each raising NotImplementedError with a one-line comment.


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, ${cls}!")


if __name__ == "__main__":
    main()
`,
}

for (let n = 1; n <= stageCount; n++) {
  const s = `stages/${n}`
  files[`${s}/prompt.md`] = `${TODO}: stage ${n} prompt. ${n === 1 ? 'Intro paragraph, then' : 'Describe only what is new or changed, then'} an "### Operations" table and an "### Example".\n`
  files[`${s}/stage.json`] = `${JSON.stringify({ title: `${TODO}: stage ${n} title`, hints: [`${TODO}: nudge`, `${TODO}: technique`, `${TODO}: near-solution`] }, null, 2)}\n`
  files[`${s}/tests.py`] = `from solution import ${cls}


def test_placeholder():
    """${TODO}: replace with 8-12 real tests."""
    assert ${cls}() is None
`
  files[`${s}/solution.py`] = `# ${TODO}: full reference solution passing stages 1..${n}.
class ${cls}:
    pass
`
}

for (const [rel, content] of Object.entries(files)) {
  const path = join(dir, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}
console.log(`Scaffolded problems/${slug} (${stageCount} stages, order ${nextOrder}). Replace every ${TODO}, then run:\n  node scripts/verify-problems.mjs ${slug}`)
