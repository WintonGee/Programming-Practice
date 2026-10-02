import { useCallback, useEffect, useRef, useState } from 'react'
import { setCode, updateProgress } from '../state/progress'

const DELAY_MS = 400

/** Debounced write of editor code to progress; flushes on hide and unmount so a reload never loses work. */
export function useAutosave(slug: string, code: string): { saving: boolean; flush: () => void } {
  const latest = useRef(code)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [savedCode, setSavedCode] = useState(code)

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const value = latest.current
    updateProgress((s) => setCode(s, slug, value, Date.now()))
    setSavedCode(value)
  }, [slug])

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

  return { saving: savedCode !== code, flush }
}
