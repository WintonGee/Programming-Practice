import { LoaderCircle, RotateCcw } from 'lucide-react'
import { python } from '../runtime/runner'
import { useRuntimeStatus } from './useRuntimeStatus'

export function RuntimeChip({ compact = false }: { compact?: boolean }) {
  const status = useRuntimeStatus()
  const retry = () => void python.warmUp().catch(() => {})

  if (status === 'error') {
    return (
      <div role="status" className="flex items-center gap-1.5 text-[13px] text-fail">
        <span className="size-2 rounded-full bg-fail" aria-hidden />
        <span title={python.bootError ?? undefined}>{compact ? 'Python error' : 'Python failed to load'}</span>
        <button
          type="button"
          onClick={retry}
          className="ml-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium underline-offset-2 hover:underline"
        >
          <RotateCcw size={12} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  const label =
    status === 'ready' ? 'Python ready' : status === 'running' ? 'Running…' : 'Loading Python…'
  const busy = status !== 'ready'
  return (
    <div role="status" className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted">
      {busy ? (
        <LoaderCircle size={13} className="animate-spin motion-reduce:animate-none" aria-hidden />
      ) : (
        <span className="size-2 rounded-full bg-pass" aria-hidden />
      )}
      <span className={compact ? 'sr-only' : ''}>{label}</span>
    </div>
  )
}
