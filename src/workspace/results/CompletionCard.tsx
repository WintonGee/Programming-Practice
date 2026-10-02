import { CircleCheck, PartyPopper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { buttonClass } from '../../components/buttonClass'
import { formatClock, formatDuration, plural, stagesThrough } from '../../lib/format'
import { totalHintsRevealed, type ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'

interface Props {
  problem: Problem
  progress: ProblemProgress
  onContinue: () => void
}

export function StageCompleteCard({ problem, progress, onContinue }: Props) {
  const stage = progress.unlockedStage
  const next = problem.stages[stage]
  return (
    <div className="stage-enter rounded-lg border border-pass/40 bg-pass-soft px-4 py-4">
      <div className="flex items-start gap-3">
        <CircleCheck size={20} className="mt-0.5 shrink-0 text-pass" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Stage {stage} complete</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Every test for {stagesThrough(stage)} passes. Next up: {next.title.toLowerCase()}. Your code carries over.
          </p>
          <Button variant="success" className="mt-3" onClick={onContinue}>
            Continue to stage {stage + 1}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function AllCompleteCard({ problem, progress }: { problem: Problem; progress: ProblemProgress }) {
  const { attempt } = progress
  const end = attempt.finishedAt ?? attempt.stageCompletedAt[problem.stages.length] ?? attempt.startedAt
  const total = end - attempt.startedAt
  const budget = problem.estimatedMinutes * 60_000
  const hints = totalHintsRevealed(attempt)
  const splits = problem.stages.map((s, i) => {
    const doneAt = attempt.stageCompletedAt[s.number]
    const from = i === 0 ? attempt.startedAt : attempt.stageCompletedAt[s.number - 1]
    return { number: s.number, title: s.title, ms: doneAt !== undefined && from !== undefined ? doneAt - from : null }
  })

  return (
    <div className="stage-enter rounded-lg border border-pass/40 bg-pass-soft px-4 py-4">
      <div className="flex items-start gap-3">
        <PartyPopper size={20} className="mt-0.5 shrink-0 text-pass" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">All stages complete</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {progress.mode === 'interview'
              ? total <= budget
                ? `Finished inside the ${problem.estimatedMinutes}-minute interview window.`
                : `Finished ${formatDuration(total - budget)} over the ${problem.estimatedMinutes}-minute window.`
              : `All ${problem.stages.length} stages pass, with every earlier test still green.`}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Stat label="Total time" value={formatClock(total)} />
            <Stat label="Test runs" value={String(attempt.testRuns)} />
            <Stat label="Hints used" value={String(hints)} />
            <Stat
              label="Solution viewed"
              value={attempt.solutionViewed.length ? `${attempt.solutionViewed.length > 1 ? 'Stages' : 'Stage'} ${attempt.solutionViewed.join(', ')}` : 'No'}
            />
          </dl>
          <ol className="mt-4 space-y-1 border-t border-pass/20 pt-3 text-[13px]">
            {splits.map((s) => (
              <li key={s.number} className="flex gap-3">
                <span className="w-16 shrink-0 text-muted">Stage {s.number}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="font-mono text-muted tabular-nums">{s.ms === null ? 'n/a' : formatClock(s.ms)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link to="/" className={buttonClass('success', 'md')}>
              Back to problems
            </Link>
            <span className="text-[13px] text-muted">{plural(problem.stages.length, 'stage')} done. Use Start over to try again.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
