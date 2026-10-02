import { useCallback, useEffect, useRef, useState } from 'react'
import { setCodeForAttempt, updateProgress } from '../state/progress'

const DELAY_MS = 400

export type SaveStatus = 'saving' | 'saved' | 'failed'

/**
 * Debounced write of editor code to progress; flushes on hide and unmount so a reload never loses work.
 * Writes are scoped to the attempt the editor was opened for, so a stale tab can't clobber a newer attempt.
 */
export function useAutosave(
  slug: string,
  attemptStartedAt: number,
  code: string,
): { status: SaveStatus; flush: () => void } {
  const latest = useRef(code)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saved, setSaved] = useState({ code, ok: true })

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const value = latest.current
    const ok = updateProgress((s) => setCodeForAttempt(s, slug, attemptStartedAt, value, Date.now()))
    setSaved({ code: value, ok })
  }, [slug, attemptStartedAt])

  useEffect(() => {
    latest.current = code
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, DELAY_MS)
  }, [code, flush])

  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  const status: SaveStatus = !saved.ok ? 'failed' : saved.code !== code ? 'saving' : 'saved'
  return { status, flush }
}
