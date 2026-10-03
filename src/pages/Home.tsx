import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/buttonClass'
import { ContinueCard } from '../components/home/ContinueCard'
import { ProblemList } from '../components/home/ProblemList'
import { ThemeToggle } from '../components/ThemeToggle'
import { Wordmark } from '../components/Wordmark'
import { problems } from '../problems'
import { mostRecentInProgress, useProgressState } from '../state/progress'

const stageCounts = Object.fromEntries(problems.map((p) => [p.slug, p.stages.length]))

export function Home() {
  const state = useProgressState()
  const recent = mostRecentInProgress(state, stageCounts)
  const recentProblem = recent ? problems.find((p) => p.slug === recent.slug) : undefined
  const [now] = useState(() => Date.now())

  useEffect(() => {
    document.title = 'Staged: progressive coding interview practice'
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
          <Wordmark />
          <nav aria-label="Site" className="flex items-center gap-1">
            <Link to="/teacher" className={buttonClass('ghost', 'md')}>
              <GraduationCap size={16} aria-hidden />
              Teacher
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16">
        <section className="pt-10 pb-8 sm:pt-14">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight sm:text-[30px]">
            Practice progressive coding interviews
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Each problem is one Python class that grows over several stages. Pass a stage’s tests to unlock the next;
            earlier stages’ tests keep running, just like a real progressive interview.
          </p>
        </section>

        {recent && recentProblem && <ContinueCard problem={recentProblem} progress={recent.progress} now={now} />}

        <ProblemList problems={problems} />
      </main>
      <footer className="border-t border-line">
        <p className="mx-auto max-w-5xl px-5 py-5 text-[13px] text-muted">
          Your code and progress are saved in this browser only.
        </p>
      </footer>
    </div>
  )
}
