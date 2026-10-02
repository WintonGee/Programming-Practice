// Proves every problem's content against the same Pyodide runtime the browser uses.
// For each problem with stages 1..N:
//   - starter.py fails at least one stage-1 test
//   - stage k's solution.py passes every test in stages 1..k
//   - stage k's solution.py fails at least one stage-(k+1) test (each stage adds real work)
// Usage: node scripts/verify-problems.mjs [slug ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPyodide } from 'pyodide'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problemsDir = join(root, 'problems')
const pythonDir = join(root, 'src/runtime/python')

const read = (...parts) => readFileSync(join(...parts), 'utf8')

function loadProblem(slug) {
  const dir = join(problemsDir, slug)
  const stagesDir = join(dir, 'stages')
  const stageNums = readdirSync(stagesDir)
    .map(Number)
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b)
  stageNums.forEach((n, i) => {
    if (n !== i + 1) throw new Error(`${slug}: stages must be numbered 1..N, found ${stageNums}`)
  })
  const meta = JSON.parse(read(dir, 'problem.json'))
  for (const key of ['title', 'difficulty', 'order', 'tags', 'summary', 'estimatedMinutes']) {
    if (!(key in meta)) throw new Error(`${slug}/problem.json: missing "${key}"`)
  }
  const stages = stageNums.map((n) => {
    const sdir = join(stagesDir, String(n))
    for (const f of ['prompt.md', 'stage.json', 'tests.py', 'solution.py']) {
      if (!existsSync(join(sdir, f))) throw new Error(`${slug}/stages/${n}: missing ${f}`)
    }
    const stageMeta = JSON.parse(read(sdir, 'stage.json'))
    if (!stageMeta.title || !Array.isArray(stageMeta.hints) || stageMeta.hints.length === 0) {
      throw new Error(`${slug}/stages/${n}/stage.json: needs "title" and non-empty "hints"`)
    }
    return { n, tests: read(sdir, 'tests.py'), solution: read(sdir, 'solution.py') }
  })
  const placeholders = [
    ['problem.json', JSON.stringify(meta)],
    ['starter.py', read(dir, 'starter.py')],
    ...stageNums.flatMap((n) =>
      ['prompt.md', 'stage.json', 'tests.py', 'solution.py'].map((f) => [`stages/${n}/${f}`, read(stagesDir, String(n), f)]),
    ),
  ].filter(([, content]) => content.includes('TODO(author)'))
  if (placeholders.length) {
    throw new Error(`${slug}: unfinished placeholders in ${placeholders.map(([f]) => f).join(', ')}`)
  }
  return { slug, starter: read(dir, 'starter.py'), stages }
}

function summarize(results) {
  const failed = results.filter((r) => r.status !== 'pass')
  return { total: results.length, failed }
}

async function main() {
  const wanted = process.argv.slice(2)
  const slugs = readdirSync(problemsDir).filter(
    (s) => existsSync(join(problemsDir, s, 'problem.json')) && (wanted.length === 0 || wanted.includes(s)),
  )
  const pyodide = await loadPyodide()
  pyodide.FS.writeFile('/home/pyodide/harness.py', read(pythonDir, 'harness.py'))
  pyodide.FS.writeFile('/home/pyodide/runner.py', read(pythonDir, 'runner.py'))
  pyodide.runPython('import sys; sys.path.insert(0, "/home/pyodide")')
  const runTests = pyodide.runPython('from runner import run_tests; run_tests')

  const run = (code, stages) => {
    const suites = stages.map((s) => ({ stage: s.n, source: s.tests }))
    const out = JSON.parse(runTests(code, JSON.stringify(suites)))
    if (out.loadError) throw new Error(`load error: ${JSON.stringify(out.loadError)}`)
    return summarize(out.results)
  }

  let problems = 0
  const errors = []
  for (const slug of slugs) {
    let problem
    try {
      problem = loadProblem(slug)
    } catch (e) {
      errors.push(e.message)
      continue
    }
    problems++
    const { stages, starter } = problem

    try {
      const s = run(starter, [stages[0]])
      if (s.failed.length === 0) errors.push(`${slug}: starter passes all stage-1 tests`)
    } catch (e) {
      errors.push(`${slug}: starter ${e.message}`)
    }

    for (const stage of stages) {
      const label = `${slug} stage ${stage.n}`
      try {
        const s = run(stage.solution, stages.slice(0, stage.n))
        if (s.total === 0) errors.push(`${label}: no tests discovered`)
        for (const f of s.failed) {
          errors.push(`${label}: solution fails stage${f.stage}::${f.name} — ${f.message} (${f.code})`)
        }
        const counts = stages
          .slice(0, stage.n)
          .map((st) => `${(st.tests.match(/^def test_/gm) || []).length}`)
          .join('+')
        console.log(`  ok  ${label}: ${s.total} tests (${counts})`)
      } catch (e) {
        errors.push(`${label}: ${e.message}`)
      }
      const next = stages[stage.n]
      if (next) {
        try {
          const s = run(stage.solution, [next])
          if (s.failed.length === 0) errors.push(`${label}: solution already passes stage ${next.n} — stage adds nothing`)
        } catch {
          // A load error on the next stage still means the next stage requires new work.
        }
      }
    }
  }

  if (errors.length) {
    console.error(`\n${errors.length} problem(s) found:`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }
  console.log(`\nAll ${problems} problems verified.`)
}

main()
