import { Play } from 'lucide-react'
import { Button } from '../components/Button'

export type MobileView = 'prompt' | 'code' | 'results'

const VIEWS: { id: MobileView; label: string }[] = [
  { id: 'prompt', label: 'Prompt' },
  { id: 'code', label: 'Code' },
  { id: 'results', label: 'Results' },
]

interface Props {
  view: MobileView
  onView: (v: MobileView) => void
  onRunTests: () => void
  running: boolean
  resultsBadge: 'pass' | 'fail' | null
}

export function MobileNav({ view, onView, onRunTests, running, resultsBadge }: Props) {
  return (
    <nav
      aria-label="Workspace views"
      className="flex shrink-0 items-center gap-2 border-t border-line bg-panel px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex min-w-0 flex-1 rounded-lg bg-raised p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => onView(v.id)}
            className={`relative h-9 flex-1 rounded-md text-[13px] font-medium transition-colors ${
              view === v.id ? 'bg-panel text-text shadow-sm' : 'text-muted'
            }`}
          >
            {v.label}
            {v.id === 'results' && resultsBadge && (
              <span
                aria-hidden
                className={`absolute top-2 right-3 size-1.5 rounded-full ${resultsBadge === 'pass' ? 'bg-pass' : 'bg-fail'}`}
              />
            )}
          </button>
        ))}
      </div>
      <Button variant="primary" className="h-10" onClick={onRunTests} disabled={running} icon={<Play size={14} fill="currentColor" aria-hidden />}>
        Run tests
      </Button>
    </nav>
  )
}
