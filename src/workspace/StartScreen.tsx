import { ArrowLeft, Clock, Hourglass } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Difficulty } from '../components/Difficulty'
import { StageRail } from '../components/StageRail'
import { ThemeToggle } from '../components/ThemeToggle'
import { railStages } from '../lib/rail'
import type { Mode } from '../state/progress'
import type { Problem } from '../types'

interface Props {
  problem: Problem
  restarting: boolean
  initialMode: Mode
  onStart: (mode: Mode) => void
  onCancel?: () => void
}

function ModeOption({
  mode,
  selected,
  onSelect,
  icon,
  title,
  children,
  name,
}: {
  mode: Mode
  selected: boolean
  onSelect: (m: Mode) => void
  icon: ReactNode
  title: string
  children: ReactNode
  name: string
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus ${
        selected ? 'bg-raised' : 'hover:bg-raised/50'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={mode}
        checked={selected}
        onChange={() => onSelect(mode)}
        className="mt-1 size-4 shrink-0 accent-[var(--c-amber-fill)]"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="text-muted">{icon}</span>
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{children}</span>
      </span>
    </label>
  )
}

export function StartScreen({ problem, restarting, initialMode, onStart, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const name = useId()
  const first = problem.stages[0]
  const more = problem.stages.length - 1

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-5">
          <Link to="/" className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted hover:text-text">
            <ArrowLeft size={16} aria-hidden />
            All problems
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pt-10 pb-16 sm:pt-16">
        <div className="flex items-center gap-3">
          <Difficulty level={problem.difficulty} />
          <span className="text-[13px] text-muted">
            {problem.stages.length} stages, about {problem.estimatedMinutes} min
          </span>
        </div>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight">{problem.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{problem.summary}</p>

        <div className="mt-6 flex flex-col gap-2">
          <StageRail stages={railStages(problem, undefined).map((s, i) => (i === 0 ? { ...s, state: 'current' } : s))} />
          <p className="text-[13px] text-muted">
            <span className="text-text">Stage 1: {first.title}.</span>
            {more > 0 && ' Each stage you pass unlocks the next.'}
          </p>
        </div>

        <fieldset className="mt-10">
          <legend className="text-[15px] font-semibold">{restarting ? 'Start a new attempt' : 'How do you want to work?'}</legend>
          {restarting && (
            <p className="mt-1 text-[13px] text-muted">
              Your code resets to the starter, stages lock back to stage 1, and hint and solution history clears.
            </p>
          )}
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
            <ModeOption
              mode="practice"
              name={name}
              selected={mode === 'practice'}
              onSelect={setMode}
              icon={<Clock size={15} aria-hidden />}
              title="Practice"
            >
              Hints, the test files and reference solutions are available. A timer counts up so you can see your pace.
            </ModeOption>
            <ModeOption
              mode="interview"
              name={name}
              selected={mode === 'interview'}
              onSelect={setMode}
              icon={<Hourglass size={15} aria-hidden />}
              title="Interview"
            >
              A {problem.estimatedMinutes}-minute countdown. Hints, tests and solutions are hidden; test results still
              show. Closest to the real thing.
            </ModeOption>
          </div>
        </fieldset>

        <div className="mt-6 flex items-center gap-2">
          <Button variant="primary" onClick={() => onStart(mode)}>
            {mode === 'practice' ? 'Start practice' : 'Start interview'}
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Keep current attempt
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
