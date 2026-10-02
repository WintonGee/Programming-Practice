import type { ReactNode } from 'react'
import type { ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'
import { tabIds } from '../tabIds'
import { Tabs, type TabDef } from '../Tabs'
import { HintsTab } from './HintsTab'
import { PromptTab } from './PromptTab'
import { SolutionTab } from './SolutionTab'
import { TestsTab } from './TestsTab'

export type LeftTab = 'prompt' | 'hints' | 'tests' | 'solution' | 'teacher'

interface Props {
  problem: Problem
  progress: ProblemProgress
  tab: LeftTab
  onTab: (tab: LeftTab) => void
  viewStage: number
  onViewStage: (stage: number) => void
  arrivedStage: number | null
  onDismissArrived: () => void
  /** Stays mounted while other tabs show, so an answer keeps streaming and the scroll position survives. */
  teacher: ReactNode
}

const PRACTICE_TABS: TabDef<LeftTab>[] = [
  { id: 'prompt', label: 'Prompt' },
  { id: 'hints', label: 'Hints' },
  { id: 'tests', label: 'Tests' },
  { id: 'solution', label: 'Solution' },
  { id: 'teacher', label: 'Teacher' },
]

const INTERVIEW_TABS = PRACTICE_TABS.filter((t) => t.id === 'prompt' || t.id === 'teacher')

export function LeftPane({ problem, progress, tab, onTab, viewStage, onViewStage, arrivedStage, onDismissArrived, teacher }: Props) {
  const interview = progress.mode === 'interview'
  const tabs = interview ? INTERVIEW_TABS : PRACTICE_TABS
  const active = interview && tab !== 'teacher' ? 'prompt' : tab
  const ids = tabIds('left', active)
  const teacherIds = tabIds('left', 'teacher')

  return (
    <section aria-label="Problem" className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex h-10 shrink-0 items-stretch justify-between border-b border-line px-2">
        <Tabs tabs={tabs} value={active} onChange={onTab} label="Problem panels" idPrefix="left" />
        {interview && (
          <span className="self-center pr-2 text-xs text-muted">Interview mode: hints, tests and solutions are hidden</span>
        )}
      </div>
      {active !== 'teacher' && (
        <div
          id={ids.panel}
          role="tabpanel"
          aria-labelledby={ids.tab}
          tabIndex={0}
          className="scroll-pane min-h-0 flex-1 focus-visible:-outline-offset-2"
        >
          {active === 'prompt' && (
            <PromptTab
              problem={problem}
              progress={progress}
              viewStage={viewStage}
              onViewStage={onViewStage}
              arrivedStage={arrivedStage}
              onDismissArrived={onDismissArrived}
            />
          )}
          {active === 'hints' && <HintsTab problem={problem} progress={progress} />}
          {active === 'tests' && <TestsTab problem={problem} progress={progress} />}
          {active === 'solution' && <SolutionTab problem={problem} progress={progress} />}
        </div>
      )}
      <div
        id={teacherIds.panel}
        role="tabpanel"
        aria-labelledby={teacherIds.tab}
        className={active === 'teacher' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}
      >
        {teacher}
      </div>
    </section>
  )
}
