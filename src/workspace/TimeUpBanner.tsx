import { Hourglass, X } from 'lucide-react'
import { IconButton } from '../components/Button'

export function TimeUpBanner({ minutes, onDismiss }: { minutes: number; onDismiss: () => void }) {
  return (
    <div role="status" className="flex shrink-0 items-center gap-3 border-b border-fail/30 bg-fail-soft px-4 py-2 text-[13px]">
      <Hourglass size={15} className="shrink-0 text-fail" aria-hidden />
      <p className="min-w-0 flex-1">
        <span className="font-semibold text-text">Time’s up.</span>{' '}
        <span className="text-muted">
          The {minutes}-minute window has ended. Keep working if you like; the overrun is recorded.
        </span>
      </p>
      <IconButton label="Dismiss" onClick={onDismiss} className="size-7">
        <X size={15} aria-hidden />
      </IconButton>
    </div>
  )
}
