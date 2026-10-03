import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { ReadOnlyCode } from '../../editor/ReadOnlyCode'
import { plural } from '../../lib/format'
import { countTests } from '../../problems/parse'
import type { ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'

export function TestsTab({ problem, progress }: { problem: Problem; progress: ProblemProgress }) {
  const unlocked = problem.stages.slice(0, progress.unlockedStage)
  const [open, setOpen] = useState<Set<number>>(() => new Set([progress.unlockedStage]))
  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })

  return (
    <div className="px-5 pt-5 pb-10 sm:px-6">
      <h2 className="text-[15px] font-semibold">Test files</h2>
      <p className="mt-1 text-[13px] text-muted">
        Exactly what Run tests checks. Line numbers match the failure locations in results.
      </p>
      <div className="mt-5 space-y-3">
        {[...unlocked].reverse().map((s) => {
          const expanded = open.has(s.number)
          return (
            <section key={s.number} className="overflow-hidden rounded-lg border border-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggle(s.number)}
                  className="flex w-full items-center gap-2 bg-raised/60 px-3 py-2 text-left text-[13px] hover:bg-raised focus-visible:-outline-offset-2"
                >
                  <ChevronRight
                    size={15}
                    className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                  <span className="font-mono text-text">stage{s.number}_tests.py</span>
                  <span className="truncate text-muted">{s.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted">{plural(countTests(s.tests), 'test')}</span>
                </button>
              </h3>
              {expanded && (
                <div className="border-t border-line">
                  <ReadOnlyCode code={s.tests} label={`Stage ${s.number} tests`} />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
