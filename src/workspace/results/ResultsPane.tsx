import { FlaskConical, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMs, stagesThrough } from '../../lib/format'
import { shortcuts } from '../../lib/platform'
import type { RuntimeStatus } from '../../runtime/runner'
import { isFinished, type ProblemProgress } from '../../state/progress'
import type { Problem } from '../../types'
import { tabIds } from '../tabIds'
import { Tabs } from '../Tabs'
import type { FileRunRecord, ResultsTab, RunKind, TestRunRecord } from '../types'
import { CrashBanner, LoadErrorBanner, TimeoutBanner } from './Banners'
import { AllCompleteCard, StageCompleteCard } from './CompletionCard'
import { OutputView } from './OutputView'
import { TestResults } from './TestResults'

interface Props {
  problem: Problem
  progress: ProblemProgress
  tab: ResultsTab
  onTab: (tab: ResultsTab) => void
  testRun: TestRunRecord | null
  fileRun: FileRunRecord | null
  running: RunKind | null
  runtime: RuntimeStatus
  onRunTests: () => void
  onRunFile: () => void
  onJump: (line: number) => void
  onContinue: () => void
}

function Summary({ record, running }: { record: TestRunRecord | null; running: boolean }) {
  let content: ReactNode = null
  if (running) content = <span className="text-muted">Running tests…</span>
  else if (record?.run.kind === 'ok') {
    const { run } = record
    if (run.loadError) content = <span className="font-medium text-fail">Code didn’t load</span>
    else {
      const passing = run.results.filter((r) => r.status === 'pass').length
      const all = passing === run.results.length && run.results.length > 0
      content = (
        <>
          <span className={`font-semibold ${all ? 'text-pass-text' : 'text-fail'}`}>
            {passing} of {run.results.length} passing
          </span>
          <span className="text-muted">Stage {record.stage}</span>
          <span className="text-muted tabular-nums">{formatMs(run.ms)}</span>
        </>
      )
    }
  } else if (record?.run.kind === 'timeout') content = <span className="font-medium text-fail">Timed out</span>
  else if (record?.run.kind === 'crash') content = <span className="font-medium text-fail">Run failed</span>
  return (
    <div aria-live="polite" aria-atomic="true" className="flex items-center gap-3 text-[13px] whitespace-nowrap" data-testid="results-summary">
      {content}
    </div>
  )
}

function Running({ runtime, label }: { runtime: RuntimeStatus; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-[13px] text-muted">
      <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />
      {runtime === 'loading' || runtime === 'idle'
        ? 'Starting Python. The first run takes a few seconds.'
        : label}
    </div>
  )
}

export function ResultsPane(props: Props) {
  const { problem, progress, tab, onTab, testRun, fileRun, running, runtime, onRunTests, onRunFile, onJump, onContinue } =
    props
  const count = problem.stages.length
  const finished = isFinished(progress, count)
  const ready = !finished && progress.completedStages.includes(progress.unlockedStage)
  const ids = tabIds('results', tab)

  const completion = finished ? (
    <AllCompleteCard problem={problem} progress={progress} />
  ) : ready ? (
    <StageCompleteCard problem={problem} progress={progress} onContinue={onContinue} />
  ) : null

  let body: ReactNode
  if (tab === 'output') {
    body =
      running === 'file' ? (
        <Running runtime={runtime} label="Running solution.py…" />
      ) : (
        <OutputView record={fileRun} onRetry={onRunFile} onJump={onJump} />
      )
  } else if (running === 'tests') {
    body = <Running runtime={runtime} label={`Running tests for ${stagesThrough(progress.unlockedStage)}…`} />
  } else if (!testRun || testRun.stage !== progress.unlockedStage) {
    body = completion ?? (
      <div className="flex flex-col items-start gap-2 py-2 text-[13px] text-muted">
        <FlaskConical size={18} aria-hidden />
        <p>
          Run tests to check {stagesThrough(progress.unlockedStage)}.
          {progress.unlockedStage > 1 && ' Earlier stages keep running as regression.'}
        </p>
        <p>
          Shortcut: <kbd className="font-mono text-text">{shortcuts.runTests}</kbd>
        </p>
      </div>
    )
  } else {
    const { run } = testRun
    body =
      run.kind === 'timeout' ? (
        <TimeoutBanner />
      ) : run.kind === 'crash' ? (
        <CrashBanner message={run.message} onRetry={onRunTests} />
      ) : run.loadError ? (
        <LoadErrorBanner error={run.loadError} onJump={onJump} />
      ) : (
        <div className="space-y-3">
          {completion}
          <TestResults problem={problem} stage={testRun.stage} results={run.results} onJump={onJump} />
        </div>
      )
  }

  return (
    <section aria-label="Results" className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex h-10 shrink-0 items-stretch justify-between gap-3 border-b border-line px-2">
        <Tabs
          tabs={[
            { id: 'tests', label: 'Test results' },
            { id: 'output', label: 'Output' },
          ]}
          value={tab}
          onChange={onTab}
          label="Results panels"
          idPrefix="results"
        />
        <div className="flex min-w-0 items-center pr-2">
          {tab === 'tests' && <Summary record={testRun} running={running === 'tests'} />}
        </div>
      </div>
      <div
        id={ids.panel}
        role="tabpanel"
        aria-labelledby={ids.tab}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {body}
      </div>
    </section>
  )
}
