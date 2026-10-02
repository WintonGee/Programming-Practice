import { Lightbulb } from 'lucide-react'
import { Button } from '../../components/Button'
import { revealHint, updateProgress, type ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'
import { Markdown } from '../../components/Markdown'

export function HintsTab({ problem, progress }: { problem: Problem; progress: ProblemProgress }) {
  const stage = problem.stages[progress.unlockedStage - 1]
  const total = stage.hints.length
  const shown = Math.min(progress.attempt.hintsRevealed[stage.number] ?? 0, total)

  return (
    <div className="px-5 pt-5 pb-10 sm:px-6">
      <h2 className="text-[15px] font-semibold">Hints for stage {stage.number}</h2>
      <p className="mt-1 text-[13px] text-muted">
        Each hint gives away a little more. Revealed hints are counted in this attempt’s stats.
      </p>

      {total === 0 ? (
        <p className="mt-6 text-sm text-muted">This stage has no hints.</p>
      ) : (
        <>
          {shown > 0 && (
            <ol className="mt-5 space-y-3">
              {stage.hints.slice(0, shown).map((hint, i) => (
                <li key={i} className="stage-enter rounded-lg border border-line bg-bg/40 px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-muted">Hint {i + 1}</p>
                  <div className="text-sm">
                    <Markdown source={hint} />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5">
            {shown < total ? (
              <Button
                icon={<Lightbulb size={15} aria-hidden />}
                onClick={() => updateProgress((s) => revealHint(s, problem.slug, stage.number, total, Date.now()))}
              >
                Show hint {shown + 1} of {total}
              </Button>
            ) : (
              <p className="text-[13px] text-muted">All {total} hints are shown.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
