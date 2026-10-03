import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import type { CodeEditorHandle } from '../editor/CodeEditor'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useIsMobile } from '../lib/useMediaQuery'
import { python } from '../runtime/runner'
import { isFinished, setCode, unlockNextStage, updateProgress, type ProblemProgress } from '../state/progress'
import { safeStorage } from '../state/storage'
import { buildProblemContext, summarizeRun } from '../tutor/context'
import { TutorChat } from '../tutor/TutorChat'
import type { Problem } from '../types'
import { EditorPane } from './EditorPane'
import { Header, type Celebrate } from './Header'
import { LeftPane, type LeftTab } from './left/LeftPane'
import { MobileNav, type MobileView } from './MobileNav'
import { ResultsPane } from './results/ResultsPane'
import { TimeUpBanner } from './TimeUpBanner'
import { allTestsPassed, type ResultsTab } from './types'
import { useAutosave } from './useAutosave'
import { useInterviewDeadline } from './useInterviewDeadline'
import { useRuns } from './useRuns'
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

  useEffect(() => {
    document.documentElement.classList.add('app-shell')
    return () => document.documentElement.classList.remove('app-shell')
  }, [])

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
  const [mobileView, setMobileView] = useState<MobileView>('code')
  const [timeUpDismissed, setTimeUpDismissed] = useState(false)

  useEffect(() => {
    void python.warmUp().catch(() => {})
  }, [])

  useDocumentTitle(`${problem.title} | Staged`)

  useEffect(() => {
    if (!celebrate) return
    const id = setTimeout(() => setCelebrate(null), 2500)
    return () => clearTimeout(id)
  }, [celebrate])

  useInterviewDeadline(problem, progress)
  const { mode, attempt } = progress

  const { running, testRun, fileRun, testRunRef, clearTestRun, currentProgress, runTests, runFile } = useRuns({
    problem,
    codeRef,
    editor,
    flush,
    onRunStart: (kind) => {
      setResultsTab(kind === 'tests' ? 'tests' : 'output')
      setMobileView('results')
    },
    onStageComplete: (stage, alreadyDone) => {
      if (stage === count && !alreadyDone) setCelebrate({ fill: stage, arrive: null })
    },
  })

  const onContinue = () => {
    const from = progress.unlockedStage
    updateProgress((s) => unlockNextStage(s, slug, count, Date.now()))
    setCelebrate({ fill: from, arrive: from + 1 })
    setArrivedStage(from + 1)
    setViewStage(from + 1)
    setLeftTab('prompt')
    clearTestRun()
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
      running={running !== null}
      onRunTests={() => void runTests()}
      onRunFile={() => void runFile()}
      mobile={mobile}
    />
  )
  // Read through refs at send time so a question asked mid-edit sees the latest code and run.
  const tutorContext = () =>
    buildProblemContext({
      problem,
      progress: currentProgress() ?? progress,
      code: codeRef.current,
      testRun: testRunRef.current,
    })
  const lastRun = summarizeRun(testRun, progress.unlockedStage)
  const teacher = (
    <TutorChat
      thread={slug}
      getContext={tutorContext}
      scope={{
        kind: 'problem',
        mode,
        hasFailures: !!lastRun && (lastRun.failures.length > 0 || lastRun.loadError !== undefined),
      }}
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
      teacher={teacher}
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
    const badge = !testRun ? null : allTestsPassed(testRun.run) ? 'pass' : 'fail'
    return (
      <div className="flex h-dvh flex-col overflow-clip">
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
    <div className="flex h-dvh flex-col overflow-clip">
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
