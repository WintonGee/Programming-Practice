import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { CodeEditorHandle } from '../editor/CodeEditor'
import { python } from '../runtime/runner'
import { completeStage, getProgressState, normalizeProgress, recordTestRun, updateProgress } from '../state/progress'
import type { LoadError, Problem } from '../types'
import { allTestsPassed, type FileRunRecord, type RunKind, type TestRunRecord } from './types'

interface Options {
  problem: Problem
  codeRef: RefObject<string>
  editor: RefObject<CodeEditorHandle | null>
  flush: () => void
  onRunStart: (kind: RunKind) => void
  onStageComplete: (stage: number, alreadyDone: boolean) => void
}

/** Python test and file runs for the workspace, plus the global Cmd/Ctrl+Enter shortcuts. */
export function useRuns({ problem, codeRef, editor, flush, onRunStart, onStageComplete }: Options) {
  const slug = problem.slug
  const count = problem.stages.length
  const [testRun, setTestRun] = useState<TestRunRecord | null>(null)
  const testRunRef = useRef(testRun)
  useEffect(() => {
    testRunRef.current = testRun
  }, [testRun])
  const [fileRun, setFileRun] = useState<FileRunRecord | null>(null)
  const [running, setRunning] = useState<RunKind | null>(null)
  const runningRef = useRef(false)

  // Keeps runTests/runFile stable so the keydown listener doesn't re-subscribe every render.
  const callbacks = useRef({ onRunStart, onStageComplete })
  useEffect(() => {
    callbacks.current = { onRunStart, onStageComplete }
  }, [onRunStart, onStageComplete])

  const currentProgress = useCallback(() => {
    const raw = getProgressState().problems[slug]
    return raw ? normalizeProgress(raw, count) : null
  }, [slug, count])

  /** Mark the error line only if the editor still holds the code that produced it. */
  const showRunError = useCallback(
    (ranCode: string, error: LoadError | null) => {
      const fresh = codeRef.current === ranCode
      editor.current?.showError(
        fresh && error?.line ? { line: error.line, column: error.column, message: error.message } : null,
      )
    },
    [codeRef, editor],
  )

  const runTests = useCallback(async () => {
    const p = currentProgress()
    if (runningRef.current || !p) return
    runningRef.current = true
    flush()
    const stage = p.unlockedStage
    const attemptStartedAt = p.attempt.startedAt
    const ranCode = codeRef.current
    setRunning('tests')
    callbacks.current.onRunStart('tests')
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
    if (allTestsPassed(run)) {
      const alreadyDone = now.completedStages.includes(stage)
      updateProgress((s) => completeStage(s, slug, { attemptStartedAt, stage, stageCount: count }, Date.now()))
      callbacks.current.onStageComplete(stage, alreadyDone)
    }
  }, [slug, count, problem.stages, flush, currentProgress, codeRef, showRunError])

  const runFile = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    flush()
    setRunning('file')
    callbacks.current.onRunStart('file')
    const ranCode = codeRef.current
    const run = await python.runFile(ranCode)
    runningRef.current = false
    setRunning(null)
    setFileRun({ run, code: ranCode })
    showRunError(ranCode, run.kind === 'ok' ? run.error : null)
  }, [flush, codeRef, showRunError])

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

  const clearTestRun = () => setTestRun(null)

  return { running, testRun, fileRun, testRunRef, clearTestRun, currentProgress, runTests, runFile }
}
