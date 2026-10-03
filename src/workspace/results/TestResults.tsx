import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Problem, TestResult } from '../../types'
import { passCount } from '../types'
import { TestRow } from './TestRow'

interface GroupProps {
  title: string
  stage: number
  results: TestResult[]
  regression: boolean
  onJump?: (line: number) => void
}

function StageGroup({ title, stage, results, regression, onJump }: GroupProps) {
  const passing = passCount(results)
  const allPass = passing === results.length
  const [open, setOpen] = useState(!regression || !allPass)
  const heading = (
    <>
      <span className="font-medium text-text">
        Stage {stage}
        {regression && <span className="font-normal text-muted"> regression</span>}
      </span>
      <span className="min-w-0 flex-1 truncate text-muted">{title}</span>
      <span className={`shrink-0 text-xs tabular-nums ${allPass ? 'text-pass-text' : 'text-fail'}`}>
        {passing} of {results.length}
      </span>
    </>
  )
  return (
    <section className="overflow-hidden rounded-lg border border-line">
      <h3 className="text-[13px]">
        {regression ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 bg-raised/60 px-3 py-2 text-left hover:bg-raised focus-visible:-outline-offset-2"
          >
            <ChevronRight size={15} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />
            {heading}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-raised/60 px-3 py-2">{heading}</div>
        )}
      </h3>
      {open &&
        (results.length === 0 ? (
          <p className="border-t border-line px-3 py-2 text-[13px] text-muted">No tests were found in this stage’s file.</p>
        ) : (
          <ul className="border-t border-line">
            {results.map((r) => (
              <TestRow key={r.name} result={r} onJump={onJump} />
            ))}
          </ul>
        ))}
    </section>
  )
}

/** Current stage first, then earlier stages as collapsible regression groups. */
export function TestResults({
  problem,
  stage,
  results,
  onJump,
}: {
  problem: Problem
  stage: number
  results: TestResult[]
  onJump?: (line: number) => void
}) {
  const order = [stage, ...Array.from({ length: stage - 1 }, (_, i) => i + 1)]
  return (
    <div className="space-y-3">
      {order.map((n) => (
        <StageGroup
          key={n}
          stage={n}
          title={problem.stages[n - 1]?.title ?? ''}
          results={results.filter((r) => r.stage === n)}
          regression={n !== stage}
          onJump={onJump}
        />
      ))}
    </div>
  )
}
