import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { getProblem } from '../problems'
import { startAttempt, updateProgress, useProblemProgress } from '../state/progress'
import type { Problem } from '../types'
import { StartScreen } from '../workspace/StartScreen'
import { WorkspaceView } from '../workspace/WorkspaceView'
import { NotFound } from './NotFound'

export function Workspace() {
  const { slug = '' } = useParams()
  const problem = getProblem(slug)
  if (!problem) return <NotFound what="problem" />
  return <ProblemWorkspace key={problem.slug} problem={problem} />
}

function ProblemWorkspace({ problem }: { problem: Problem }) {
  const progress = useProblemProgress(problem.slug, problem.stages.length)
  const [restarting, setRestarting] = useState(false)

  if (!progress || restarting) {
    return (
      <StartScreen
        problem={problem}
        restarting={!!progress}
        initialMode={progress?.mode ?? 'practice'}
        onStart={(mode) => {
          updateProgress((s) => startAttempt(s, problem.slug, mode, problem.starter, Date.now()))
          setRestarting(false)
        }}
        onCancel={progress ? () => setRestarting(false) : undefined}
      />
    )
  }

  return (
    <WorkspaceView
      key={progress.attempt.startedAt}
      problem={problem}
      progress={progress}
      onStartOver={() => setRestarting(true)}
    />
  )
}
