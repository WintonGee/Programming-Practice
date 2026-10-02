import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import type { CodeEditorHandle } from '../editor/CodeEditor'
import { useIsMobile } from '../lib/useMediaQuery'
import { python } from '../runtime/runner'
import {
  completeStage,
  getProgressState,
  isFinished,
  markTimeUp,
  normalizeProgress,
  recordTestRun,
  setCode,
  unlockNextStage,
  updateProgress,
  type ProblemProgress,
} from '../state/progress'
import { safeStorage } from '../state/storage'
import type { LoadError, Problem } from '../types'
import { EditorPane } from './EditorPane'
import { Header, type Celebrate } from './Header'
import { LeftPane, type LeftTab } from './left/LeftPane'
import { MobileNav, type MobileView } from './MobileNav'
import { ResultsPane } from './results/ResultsPane'
import { TimeUpBanner } from './TimeUpBanner'
import type { FileRunRecord, ResultsTab, RunKind, TestRunRecord } from './types'
import { useAutosave } from './useAutosave'
import { useRuntimeStatus } from './useRuntimeStatus'

interface Props {
  problem: Problem
  progress: ProblemProgress
  onStartOver: () => void
}

export function WorkspaceView({ problem, progress, onStartOver }: Props) {
  const slug = problem.slug
  const count = problem.stages.length
  const mobile = useIsMobile()
  const runtime = useRuntimeStatus()
  const editor = useRef<CodeEditorHandle>(null)

  const [code, setCodeLocal] = useState(progress.code)
  const { status: saveStatus, flush } = useAutosave(slug, progress.attempt.startedAt, code)
  const codeRef = useRef(code)
  useEffect(() => {
    codeRef.current = code
  }, [code])

  const [leftTab, setLeftTab] = useState<LeftTab>('prompt')
  const [viewStage, setViewStage] = useState(progress.unlockedStage)
  const [arrivedStage, setArrivedStage] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState<Celebrate | null>(null)
  const [resultsTab, setResultsTab] = useState<ResultsTab>('tests')
  const [testRun, setTestRun] = useState<TestRunRecord | null>(null)
  const [fileRun, setFileRun] = useState<FileRunRecord | null>(null)
  const [running, setRunning] = useState<RunKind | null>(null)
  const runningRef = useRef(false)
  const [mobileView, setMobileView] = useState<MobileView>('code')
  const [timeUpDismissed, setTimeUpDismissed] = useState(false)

  useEffect(() => {
    void python.warmUp().catch(() => {})
  }, [])

  useEffect(() => {
    document.title = `${problem.title} | Staged`
  }, [problem.title])

  useEffect(() => {
    if (!celebrate) return
    const id = setTimeout(() => setCelebrate(null), 2500)
    return () => clearTimeout(id)
  }, [celebrate])

  // Interview countdown: record the moment time runs out, even if the tab is idle.
  const { mode, attempt } = progress
  useEffect(() => {
    if (mode !== 'interview' || attempt.timeUpAt !== undefined || attempt.finishedAt !== undefined) return
    const deadline = attempt.startedAt + problem.estimatedMinutes * 60_000
    const fire = () => updateProgress((s) => markTimeUp(s, slug, deadline))
    const wait = deadline - Date.now()
    if (wait <= 0) {
      fire()
      return
    }
    const id = setTimeout(fire, Math.min(wait, 2 ** 31 - 1))
    return () => clearTimeout(id)
  }, [mode, attempt.timeUpAt, attempt.finishedAt, attempt.startedAt, problem.estimatedMinutes, slug])

  const currentProgress = useCallback(() => {
    const raw = getProgressState().problems[slug]
    return raw ? normalizeProgress(raw, count) : null
  }, [slug, count])

  /** Mark the error line only if the editor still holds the code that produced it. */
  const showRunError = (ranCode: string, error: LoadError | null) => {
    const fresh = codeRef.current === ranCode
    editor.current?.showError(
      fresh && error?.line ? { line: error.line, column: error.column, message: error.message } : null,
    )
  }

  const runTests = useCallback(async () => {
    const p = currentProgress()
    if (runningRef.current || !p) return
    runningRef.current = true
    flush()
    const stage = p.unlockedStage
    const attemptStartedAt = p.attempt.startedAt
    const ranCode = codeRef.current
    setRunning('tests')
    setResultsTab('tests')
    setMobileView('results')
    updateProgress((s) => recordTestRun(s, slug, Date.now()))
    const suites = problem.stages.slice(0, stage).map((s) => ({ stage: s.number, source: s.tests }))
    const run = await python.runTests(ranCode, suites)
    runningRef.current = false
    setRunning(null)

    // The attempt or stage moved on while Python was busy; this result no longer describes anything on screen.
    const now = currentProgress()
    if (!now || now.attempt.startedAt !== attemptStartedAt || now.unlockedStage !== stage) return

    setTestRun({ run, stage, code: ranCode })
    showRunError(ranCode, run.kind === 'ok' ? run.loadError : null)
    if (run.kind === 'ok' && !run.loadError && run.results.length > 0 && run.results.every((r) => r.status === 'pass')) {
      const alreadyDone = now.completedStages.includes(stage)
      updateProgress((s) => completeStage(s, slug, { attemptStartedAt, stage, stageCount: count }, Date.now()))
      if (stage === count && !alreadyDone) setCelebrate({ fill: stage, arrive: null })
    }
  }, [slug, count, problem.stages, flush, currentProgress])

  const runFile = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    flush()
    setRunning('file')
    setResultsTab('output')
    setMobileView('results')
    const ranCode = codeRef.current
    const run = await python.runFile(ranCode)
    runningRef.current = false
    setRunning(null)
    setFileRun({ run, code: ranCode })
    showRunError(ranCode, run.kind === 'ok' ? run.error : null)
  }, [flush])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey) || e.repeat) return
      e.preventDefault()
      if (e.shiftKey) void runFile()
      else void runTests()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [runTests, runFile])

  const onContinue = () => {
    const from = progress.unlockedStage
    updateProgress((s) => unlockNextStage(s, slug, count, Date.now()))
    setCelebrate({ fill: from, arrive: from + 1 })
    setArrivedStage(from + 1)
    setViewStage(from + 1)
    setLeftTab('prompt')
    setTestRun(null)
    setMobileView('prompt')
  }

  const onJump = (line: number) => {
    setMobileView('code')
    // On mobile the editor becomes visible this frame; scroll after layout.
    requestAnimationFrame(() => editor.current?.jumpTo(line))
  }

  const onResetCode = () => {
    setCodeLocal(problem.starter)
    updateProgress((s) => setCode(s, slug, problem.starter, Date.now()))
    editor.current?.showError(null)
  }

  const finished = isFinished(progress, count)
  const showTimeUp = mode === 'interview' && attempt.timeUpAt !== undefined && !timeUpDismissed && !finished

  const header = (
    <Header
      problem={problem}
      progress={progress}
      celebrate={celebrate}
      running={running}
      onRunTests={() => void runTests()}
      onRunFile={() => void runFile()}
      mobile={mobile}
    />
  )
  const left = (
    <LeftPane
      problem={problem}
      progress={progress}
      tab={leftTab}
      onTab={setLeftTab}
      viewStage={viewStage}
      onViewStage={setViewStage}
      arrivedStage={arrivedStage}
      onDismissArrived={() => setArrivedStage(null)}
    />
  )
  const editorPane = (
    <EditorPane
      code={code}
      onChange={setCodeLocal}
      saveStatus={saveStatus}
      onRunFile={() => void runFile()}
      onResetCode={onResetCode}
      onStartOver={() => {
        flush()
        onStartOver()
      }}
      running={running !== null}
      mobile={mobile}
      editorRef={editor}
    />
  )
  const results = (
    <ResultsPane
      problem={problem}
      progress={progress}
      tab={resultsTab}
      onTab={setResultsTab}
      testRun={testRun}
      fileRun={fileRun}
      running={running}
      runtime={runtime}
      onRunTests={() => void runTests()}
      onRunFile={() => void runFile()}
      onJump={onJump}
      currentCode={code}
      onContinue={onContinue}
    />
  )
  const banner = showTimeUp && (
    <TimeUpBanner minutes={problem.estimatedMinutes} onDismiss={() => setTimeUpDismissed(true)} />
  )

  if (mobile) {
    const badge =
      testRun?.run.kind === 'ok' && !testRun.run.loadError
        ? testRun.run.results.every((r) => r.status === 'pass')
          ? 'pass'
          : 'fail'
        : testRun
          ? 'fail'
          : null
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        {header}
        {banner}
        <main className="relative min-h-0 flex-1">
          <div className={`absolute inset-0 ${mobileView === 'prompt' ? '' : 'hidden'}`}>{left}</div>
          <div className={`absolute inset-0 ${mobileView === 'code' ? '' : 'hidden'}`}>{editorPane}</div>
          <div className={`absolute inset-0 ${mobileView === 'results' ? '' : 'hidden'}`}>{results}</div>
        </main>
        <MobileNav
          view={mobileView}
          onView={setMobileView}
          onRunTests={() => void runTests()}
          running={running !== null}
          resultsBadge={badge}
        />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {header}
      {banner}
      <DesktopPanes left={left} editor={editorPane} results={results} />
    </div>
  )
}

function DesktopPanes({ left, editor, results }: { left: ReactNode; editor: ReactNode; results: ReactNode }) {
  const main = useDefaultLayout({ id: 'staged:panes:main', storage: safeStorage })
  const right = useDefaultLayout({ id: 'staged:panes:right', storage: safeStorage })
  return (
    <Group
      orientation="horizontal"
      className="min-h-0 flex-1"
      defaultLayout={main.defaultLayout}
      onLayoutChanged={main.onLayoutChanged}
    >
      <Panel id="prompt" defaultSize="40%" minSize="22%">
        {left}
      </Panel>
      <Separator className="pane-handle" aria-label="Resize prompt and code" />
      <Panel id="work" minSize="35%">
        <Group
          orientation="vertical"
          className="h-full"
          defaultLayout={right.defaultLayout}
          onLayoutChanged={right.onLayoutChanged}
        >
          <Panel id="editor" defaultSize="60%" minSize="15%">
            {editor}
          </Panel>
          <Separator className="pane-handle" aria-label="Resize code and results" />
          <Panel id="results" minSize="12%">
            {results}
          </Panel>
        </Group>
      </Panel>
    </Group>
  )
}
