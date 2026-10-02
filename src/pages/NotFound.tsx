import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/buttonClass'
import { ThemeToggle } from '../components/ThemeToggle'
import { Wordmark } from '../components/Wordmark'

export function NotFound({ what = 'page' }: { what?: 'page' | 'problem' }) {
  useEffect(() => {
    document.title = 'Not found | Staged'
  }, [])
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
        <Wordmark />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center px-5 pb-24">
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {what === 'problem' ? 'That problem doesn’t exist' : 'That page doesn’t exist'}
        </h1>
        <p className="mt-2 max-w-md text-muted">
          {what === 'problem'
            ? 'The link may be out of date, or the problem was renamed. Pick one from the list instead.'
            : 'Check the address, or head back to the problem list.'}
        </p>
        <Link to="/" className={buttonClass('primary', 'md', 'mt-6')}>
          Back to problems
        </Link>
      </main>
    </div>
  )
}
