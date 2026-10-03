import { Eye, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { railStages } from '../../lib/rail'
import { isFinished, useProblemProgress, type ProblemProgress } from '../../state/progress'
import { DIFFICULTIES, type Difficulty as Level, type Problem } from '../../types'
import { Button } from '../Button'
import { Difficulty } from '../Difficulty'
import { CompactRail } from '../StageRail'

function matches(p: Problem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [p.title, p.summary, ...p.tags].some((s) => s.toLowerCase().includes(q))
}

function statusText(problem: Problem, progress: ProblemProgress | undefined): { text: string; tone: string } {
  const count = problem.stages.length
  if (!progress) return { text: 'Not started', tone: 'text-muted' }
  if (isFinished(progress, count)) return { text: 'Completed', tone: 'text-pass-text' }
  return { text: `Stage ${progress.unlockedStage} of ${count}`, tone: 'text-amber-text' }
}

export function ProblemList({ problems }: { problems: Problem[] }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const searchId = useId()
  const visible = problems.filter((p) => (!level || p.difficulty === level) && matches(p, query))
  const filtered = query.trim() !== '' || level !== null

  return (
    <section aria-labelledby="problems-heading">
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center">
        <h2 id="problems-heading" className="mr-auto text-[15px] font-semibold">
          Problems <span className="ml-1 font-normal text-muted">{visible.length}</span>
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 sm:w-60">
            <label htmlFor={searchId} className="sr-only">
              Search problems
            </label>
            <Search size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or tag"
              className="h-8 w-full rounded-md border border-line bg-panel pr-2 pl-8 text-sm text-text placeholder:text-muted focus:border-focus focus:outline-none"
            />
          </div>
          <div role="group" aria-label="Filter by difficulty" className="flex self-start rounded-md border border-line bg-panel p-0.5">
            {DIFFICULTIES.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(level === l ? null : l)}
                className={`h-[26px] rounded-[5px] px-2.5 text-[13px] font-medium transition-colors ${
                  level === l ? 'bg-raised text-text shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div
          aria-hidden
          className="hidden grid-cols-[minmax(0,1fr)_84px_168px_64px_72px] gap-4 border-b border-line px-5 py-2 text-xs font-medium text-muted md:grid"
        >
          <span>Problem</span>
          <span>Difficulty</span>
          <span>Progress</span>
          <span className="text-right">Time</span>
          <span className="text-right">Stages</span>
        </div>
        {visible.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-5 py-10">
            <p className="text-sm text-muted">
              {problems.length === 0
                ? 'No problems are available yet.'
                : `No problems match${query.trim() ? ` “${query.trim()}”` : ''}${level ? ` at ${level} difficulty` : ''}.`}
            </p>
            {filtered && (
              <Button
                size="sm"
                icon={<X size={14} aria-hidden />}
                onClick={() => {
                  setQuery('')
                  setLevel(null)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ul>
            {visible.map((p) => (
              <ProblemRow key={p.slug} problem={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function ProblemRow({ problem }: { problem: Problem }) {
  const progress = useProblemProgress(problem.slug, problem.stages.length)
  const status = statusText(problem, progress)
  const count = problem.stages.length
  const solutionViewed = (progress?.attempt.solutionViewed.length ?? 0) > 0
  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        to={`/p/${problem.slug}`}
        aria-label={`${problem.title}, ${problem.difficulty}, ${count} stages, ${status.text}`}
        className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-raised/60 focus-visible:-outline-offset-2 md:grid-cols-[minmax(0,1fr)_84px_168px_64px_72px] md:items-center"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-[15px] font-medium text-text group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
              {problem.title}
            </span>
            <span className="hidden gap-1 lg:flex">
              {problem.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded bg-raised px-1.5 py-px text-[11.5px] whitespace-nowrap text-muted">
                  {t}
                </span>
              ))}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted md:line-clamp-1">{problem.summary}</p>
        </div>
        <div className="flex items-start justify-end md:block">
          <Difficulty level={problem.difficulty} />
        </div>
        <div className="col-span-2 flex items-center gap-3 md:col-span-1">
          <CompactRail stages={railStages(problem, progress)} />
          <span className={`text-xs whitespace-nowrap ${status.tone}`}>{status.text}</span>
          {solutionViewed && (
            <span title="You viewed a reference solution in this attempt" className="text-muted">
              <Eye size={13} aria-hidden />
              <span className="sr-only">Solution viewed</span>
            </span>
          )}
          <span className="ml-auto text-xs whitespace-nowrap text-muted md:hidden">
            {count} stages, about {problem.estimatedMinutes} min
          </span>
        </div>
        <span className="hidden text-right text-[13px] text-muted tabular-nums md:block">{problem.estimatedMinutes} min</span>
        <span className="hidden text-right text-[13px] text-muted tabular-nums md:block">{count} stages</span>
      </Link>
    </li>
  )
}
