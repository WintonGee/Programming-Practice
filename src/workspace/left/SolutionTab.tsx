import { Check, Copy, Eye } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { InlineConfirm } from '../../components/InlineConfirm'
import { ReadOnlyCode } from '../../editor/ReadOnlyCode'
import { stagesThrough } from '../../lib/format'
import { markSolutionViewed, updateProgress, type ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'

export function SolutionTab({ problem, progress }: { problem: Problem; progress: ProblemProgress }) {
  const stage = problem.stages[progress.unlockedStage - 1]
  const viewed = progress.attempt.solutionViewed.includes(stage.number)
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stage.solution)
      setCopied('ok')
    } catch {
      setCopied('failed')
    }
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="px-5 pt-5 pb-10 sm:px-6">
      <h2 className="text-[15px] font-semibold">Reference solution for stage {stage.number}</h2>
      <p className="mt-1 text-[13px] text-muted">
        One way to pass {stagesThrough(stage.number)}. Try the hints first; once you look, it’s noted in this attempt.
      </p>

      {!viewed ? (
        <div className="mt-5 rounded-lg border border-dashed border-line-strong px-4 py-5">
          {confirming ? (
            <InlineConfirm
              tone="primary"
              message={`Reveal the stage ${stage.number} solution?`}
              confirmLabel="Reveal solution"
              onConfirm={() => updateProgress((s) => markSolutionViewed(s, problem.slug, stage.number, Date.now()))}
              onCancel={() => setConfirming(false)}
            />
          ) : (
            <Button icon={<Eye size={15} aria-hidden />} onClick={() => setConfirming(true)}>
              Show solution
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between gap-2 border-b border-line bg-raised/60 py-1.5 pr-1.5 pl-3">
            <span className="font-mono text-[13px] text-text">solution.py</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copy}
              icon={copied === 'ok' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            >
              {copied === 'ok' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy'}
            </Button>
          </div>
          <ReadOnlyCode code={stage.solution} label={`Stage ${stage.number} reference solution`} />
        </div>
      )}
    </div>
  )
}
