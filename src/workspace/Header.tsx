import { ArrowLeft, Play, SquareTerminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Difficulty } from '../components/Difficulty'
import { StageRail } from '../components/StageRail'
import { ThemeToggle } from '../components/ThemeToggle'
import { Kbd, Tooltip } from '../components/Tooltip'
import { stagesThrough } from '../lib/format'
import { shortcuts } from '../lib/platform'
import { railStages } from '../lib/rail'
import type { ProblemProgress } from '../state/progress'
import type { Problem } from '../types'
import { AttemptTimer } from './AttemptTimer'
import { RuntimeChip } from './RuntimeChip'

export interface Celebrate {
  fill: number
  arrive: number | null
}

interface Props {
  problem: Problem
  progress: ProblemProgress
  celebrate: Celebrate | null
  running: 'tests' | 'file' | null
  onRunTests: () => void
  onRunFile: () => void
  mobile: boolean
}

function ModeBadge({ mode }: { mode: ProblemProgress['mode'] }) {
  return (
    <span className="rounded-md border border-line px-1.5 py-0.5 text-xs font-medium text-muted">
      {mode === 'interview' ? 'Interview' : 'Practice'}
    </span>
  )
}

const BackLink = () => (
  <Link
    to="/"
    aria-label="All problems"
    title="All problems"
    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-text"
  >
    <ArrowLeft size={17} aria-hidden />
  </Link>
)

export function Header({ problem, progress, celebrate, running, onRunTests, onRunFile, mobile }: Props) {
  const stages = railStages(problem, progress)
  const stage = problem.stages[progress.unlockedStage - 1]
  const rail = (
    <StageRail stages={stages} fillStage={celebrate?.fill ?? null} arriveStage={celebrate?.arrive ?? null} />
  )

  if (mobile) {
    return (
      <header className="shrink-0 border-b border-line bg-panel">
        <div className="flex h-12 items-center gap-1 px-2">
          <BackLink />
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{problem.title}</h1>
          <RuntimeChip compact />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 px-3 pb-2.5">
          {rail}
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{stage.title}</span>
          <AttemptTimer progress={progress} estimatedMinutes={problem.estimatedMinutes} />
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel pr-3 pl-2">
      <BackLink />
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h1 className="truncate text-[15px] font-semibold">{problem.title}</h1>
        <Difficulty level={problem.difficulty} />
      </div>
      <div className="mx-2 h-6 w-px shrink-0 bg-line" aria-hidden />
      <div className="flex min-w-0 items-center gap-3">
        {rail}
        <span className="hidden min-w-0 truncate text-[13px] text-muted xl:inline">
          Stage {stage.number}: {stage.title}
        </span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ModeBadge mode={progress.mode} />
        <AttemptTimer progress={progress} estimatedMinutes={problem.estimatedMinutes} />
        <div className="hidden lg:block">
          <RuntimeChip />
        </div>
        <div className="h-6 w-px bg-line" aria-hidden />
        <Tooltip label={<>Run solution.py as a script<Kbd>{shortcuts.runFile}</Kbd></>}>
          <Button
            onClick={onRunFile}
            disabled={running !== null}
            aria-keyshortcuts="Meta+Shift+Enter Control+Shift+Enter"
            icon={<SquareTerminal size={15} aria-hidden />}
          >
            Run file
          </Button>
        </Tooltip>
        <Tooltip label={<>Run tests for {stagesThrough(progress.unlockedStage)}<Kbd>{shortcuts.runTests}</Kbd></>} align="end">
          <Button
            variant="primary"
            onClick={onRunTests}
            disabled={running !== null}
            aria-keyshortcuts="Meta+Enter Control+Enter"
            icon={<Play size={14} fill="currentColor" aria-hidden />}
          >
            Run tests
          </Button>
        </Tooltip>
        <ThemeToggle />
      </div>
    </header>
  )
}
