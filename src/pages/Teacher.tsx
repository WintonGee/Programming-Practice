import { useEffect } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { Wordmark } from '../components/Wordmark'
import { GENERAL_THREAD } from '../tutor/history'
import { TutorChat } from '../tutor/TutorChat'

const generalContext = () => ({ kind: 'general' }) as const

export function Teacher() {
  useEffect(() => {
    document.title = 'Teacher | Staged'
    document.documentElement.classList.add('app-shell')
    return () => document.documentElement.classList.remove('app-shell')
  }, [])

  return (
    <div className="flex h-dvh flex-col overflow-clip">
      <header className="shrink-0 border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Wordmark />
            <span className="h-5 w-px bg-line-strong" aria-hidden />
            <h1 className="truncate text-[15px] font-medium text-muted">Teacher</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <TutorChat thread={GENERAL_THREAD} getContext={generalContext} scope={{ kind: 'general' }} wide />
      </main>
    </div>
  )
}
