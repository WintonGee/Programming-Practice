import type { ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'
import { tabIds } from '../tabIds'
import { Tabs, type TabDef } from '../Tabs'
import { HintsTab } from './HintsTab'
import { PromptTab } from './PromptTab'
import { SolutionTab } from './SolutionTab'
import { TestsTab } from './TestsTab'

export type LeftTab = 'prompt' | 'hints' | 'tests' | 'solution'

interface Props {
  problem: Problem
  progress: ProblemProgress
  tab: LeftTab
  onTab: (tab: LeftTab) => void
  viewStage: number
  onViewStage: (stage: number) => void
  arrivedStage: number | null
  onDismissArrived: () => void
}

const PRACTICE_TABS: TabDef<LeftTab>[] = [
  { id: 'prompt', label: 'Prompt' },
  { id: 'hints', label: 'Hints' },
  { id: 'tests', label: 'Tests' },
  { id: 'solution', label: 'Solution' },
]

export function LeftPane({ problem, progress, tab, onTab, viewStage, onViewStage, arrivedStage, onDismissArrived }: Props) {
  const interview = progress.mode === 'interview'
  const tabs = interview ? PRACTICE_TABS.slice(0, 1) : PRACTICE_TABS
  const active = interview ? 'prompt' : tab
  const ids = tabIds('left', active)

  return (
    <section aria-label="Problem" className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex h-10 shrink-0 items-stretch justify-between border-b border-line px-2">
        <Tabs tabs={tabs} value={active} onChange={onTab} label="Problem panels" idPrefix="left" />
        {interview && (
          <span className="self-center pr-2 text-xs text-muted">Interview mode: hints, tests and solutions are hidden</span>
        )}
      </div>
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
    </section>
  )
}
