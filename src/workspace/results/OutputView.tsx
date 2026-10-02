import { SquareTerminal } from 'lucide-react'
import { formatMs } from '../../lib/format'
import { shortcuts } from '../../lib/platform'
import type { FileRunRecord } from '../types'
import { CrashBanner, LoadErrorBanner, TimeoutBanner } from './Banners'
import { Frames } from './Frames'

interface Props {
  record: FileRunRecord | null
  onRetry: () => void
  onJump?: (line: number) => void
}

export function OutputView({ record, onRetry, onJump }: Props) {
  if (!record) {
    return (
      <div className="flex flex-col items-start gap-2 py-2 text-[13px] text-muted">
        <SquareTerminal size={18} aria-hidden />
        <p>
          Run file executes <span className="font-mono text-text">solution.py</span> as a script, like{' '}
          <span className="font-mono text-text">python solution.py</span>. Anything it prints shows up here.
        </p>
        <p>
          Shortcut: <kbd className="font-mono text-text">{shortcuts.runFile}</kbd>
        </p>
      </div>
    )
  }
  const { run } = record
  if (run.kind === 'timeout') return <TimeoutBanner />
  if (run.kind === 'crash') return <CrashBanner message={run.message} onRetry={onRetry} />

  const syntax = run.error && run.error.line != null
  return (
    <div className="space-y-3">
      {syntax && run.error && <LoadErrorBanner error={run.error} onJump={onJump} />}
      <div>
        <p className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Output</span>
          <span className="tabular-nums">{formatMs(run.ms)}</span>
        </p>
        <pre className="scroll-thin min-h-12 overflow-x-auto rounded-md border border-line bg-panel px-3 py-2 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
          {run.stdout || <span className="text-muted">No output.</span>}
        </pre>
      </div>
      {run.error && !syntax && (
        <div role="alert" className="rounded-lg border border-fail/40 bg-fail-soft px-4 py-3">
          <p className="font-mono text-[13px] break-words whitespace-pre-wrap text-fail">{run.error.message}</p>
          {run.error.frames && run.error.frames.length > 0 && (
            <div className="mt-3">
              <Frames frames={run.error.frames} onJump={onJump} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
