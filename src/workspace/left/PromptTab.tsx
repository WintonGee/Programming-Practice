import { Check, Lock, Sparkles, X } from 'lucide-react'
import { Markdown } from '../../components/Markdown'
import { IconButton } from '../../components/Button'
import { stagesThrough } from '../../lib/format'
import { stageState, type ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'

interface Props {
  problem: Problem
  progress: ProblemProgress
  viewStage: number
  onViewStage: (stage: number) => void
  arrivedStage: number | null
  onDismissArrived: () => void
}

export function PromptTab({ problem, progress, viewStage, onViewStage, arrivedStage, onDismissArrived }: Props) {
  const count = problem.stages.length
  const stage = problem.stages[Math.min(viewStage, count) - 1]
  const arrived = arrivedStage === stage.number
  const isEarlier = stage.number < progress.unlockedStage

  return (
    <div className="px-5 pt-4 pb-10 sm:px-6">
      <nav aria-label="Stages" className="-mx-1 flex gap-1 overflow-x-auto px-1 sm:gap-1.5">
        {problem.stages.map((s) => {
          const state = stageState(progress, s.number, count)
          const locked = state === 'locked'
          const selected = s.number === stage.number
          return (
            <button
              key={s.number}
              type="button"
              disabled={locked}
              aria-current={selected ? 'step' : undefined}
              onClick={() => onViewStage(s.number)}
              title={locked ? `Pass stage ${s.number - 1} to unlock` : s.title}
              className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[13px] sm:px-2.5 font-medium transition-colors disabled:cursor-not-allowed ${
                selected
                  ? 'border-line-strong bg-raised text-text'
                  : locked
                    ? 'border-transparent text-muted/70'
                    : 'border-transparent text-muted hover:bg-raised hover:text-text'
              }`}
            >
              {locked ? (
                <Lock size={12} aria-hidden />
              ) : state === 'passed' || state === 'ready' ? (
                <Check size={13} strokeWidth={2.75} className="text-pass-text" aria-hidden />
              ) : (
                <span className="size-1.5 rounded-full bg-amber" aria-hidden />
              )}
              Stage {s.number}
              {locked && <span className="sr-only">(locked)</span>}
            </button>
          )
        })}
      </nav>

      {arrived && (
        <div
          role="status"
          className="stage-enter mt-5 flex gap-3 rounded-lg border border-amber/40 bg-amber-soft px-4 py-3"
        >
          <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-text" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-text">What changed in stage {stage.number}</p>
            <p className="mt-0.5 text-muted">
              Same class, new requirements. Read the changes below, then update your code. Tests for{' '}
              {stagesThrough(stage.number - 1)} keep running, so earlier behavior must still work.
            </p>
          </div>
          <IconButton label="Dismiss" onClick={onDismissArrived} className="-mt-1 -mr-2 size-7">
            <X size={15} aria-hidden />
          </IconButton>
        </div>
      )}

      <div key={stage.number} className={arrived ? 'stage-enter-delayed' : ''}>
        <header className="mt-6 mb-4">
          <p className="text-[13px] text-muted">
            Stage {stage.number} of {count}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{stage.title}</h2>
          {isEarlier && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-pass-text">
              <Check size={14} strokeWidth={2.5} aria-hidden />
              Passed. These tests still run as regression.
            </p>
          )}
        </header>
        <Markdown source={stage.prompt} />
      </div>
    </div>
  )
}
