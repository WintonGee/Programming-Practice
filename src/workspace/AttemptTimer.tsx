import { Clock, Hourglass } from 'lucide-react'
import { formatClock } from '../lib/format'
import { useNow } from '../lib/useNow'
import type { ProblemProgress } from '../state/progress'

export function AttemptTimer({ progress, estimatedMinutes }: { progress: ProblemProgress; estimatedMinutes: number }) {
  const { startedAt, finishedAt } = progress.attempt
  const now = useNow(1000, finishedAt === undefined)
  const end = finishedAt ?? now
  const elapsed = Math.max(0, end - startedAt)

  if (progress.mode === 'practice') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted tabular-nums" title="Time spent on this attempt">
        <Clock size={13} aria-hidden />
        <span className="sr-only">Elapsed</span>
        {formatClock(elapsed)}
      </span>
    )
  }

  const remaining = estimatedMinutes * 60_000 - elapsed
  const over = remaining < 0
  const low = !over && remaining < 5 * 60_000
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[13px] font-medium tabular-nums ${
        over ? 'bg-fail-soft text-fail' : low ? 'bg-amber-soft text-amber-text' : 'bg-raised text-text'
      }`}
      title={over ? 'Time over the interview window' : 'Time left in the interview window'}
    >
      <Hourglass size={13} aria-hidden />
      <span className="sr-only">{over ? 'Over time by' : 'Time left'}</span>
      {over ? `+${formatClock(remaining)}` : formatClock(remaining)}
    </span>
  )
}
