import { useEffect } from 'react'
import { interviewWindowMs, markTimeUp, updateProgress, type ProblemProgress } from '../state/progress'
import type { Problem } from '../types'

/** Record the moment interview time runs out, even if the tab is idle. */
export function useInterviewDeadline(problem: Problem, progress: ProblemProgress): void {
  const slug = problem.slug
  const { mode, attempt } = progress
  useEffect(() => {
    if (mode !== 'interview' || attempt.timeUpAt !== undefined || attempt.finishedAt !== undefined) return
    const deadline = attempt.startedAt + interviewWindowMs(problem.estimatedMinutes)
    const fire = () => updateProgress((s) => markTimeUp(s, slug, deadline))
    const wait = deadline - Date.now()
    if (wait <= 0) {
      fire()
      return
    }
    const id = setTimeout(fire, Math.min(wait, 2 ** 31 - 1))
    return () => clearTimeout(id)
  }, [mode, attempt.timeUpAt, attempt.finishedAt, attempt.startedAt, problem.estimatedMinutes, slug])
}
