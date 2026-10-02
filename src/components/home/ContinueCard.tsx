import { Link } from 'react-router-dom'
import { railStages } from '../../lib/rail'
import { formatRelative } from '../../lib/format'
import type { ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'
import { buttonClass } from '../buttonClass'
import { StageRail } from '../StageRail'

interface Props {
  problem: Problem
  progress: ProblemProgress
  now: number
}

export function ContinueCard({ problem, progress, now }: Props) {
  const stage = problem.stages[progress.unlockedStage - 1]
  return (
    <section
      aria-labelledby="continue-heading"
      className="mb-10 flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 sm:flex-row sm:items-center sm:gap-8"
    >
      <div className="min-w-0 flex-1">
        <h2 id="continue-heading" className="text-[13px] text-muted">
          Continue where you left off
        </h2>
        <p className="mt-1 truncate text-[17px] font-semibold">{problem.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          Stage {stage.number} of {problem.stages.length}: {stage.title}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <StageRail stages={railStages(problem, progress)} />
        <p className="text-xs text-muted">
          {progress.mode === 'interview' ? 'Interview' : 'Practice'} mode, edited {formatRelative(progress.updatedAt, now)}
        </p>
      </div>
      <Link to={`/p/${problem.slug}`} className={buttonClass('primary', 'md', 'self-start sm:self-center')}>
        Continue
      </Link>
    </section>
  )
}
