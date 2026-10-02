import { CircleAlert, RotateCcw, TimerOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/Button'
import { RUN_TIMEOUT_MS } from '../../runtime/runner'
import type { LoadError } from '../../types'
import { Frames } from './Frames'

function Banner({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-fail/40 bg-fail-soft px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-fail">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{title}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LoadErrorBanner({ error, onJump }: { error: LoadError; onJump?: (line: number) => void }) {
  const line = error.line ?? null
  return (
    <Banner icon={<CircleAlert size={16} aria-hidden />} title="Your code didn’t load, so no tests ran">
      <p className="mt-1.5 font-mono text-[13px] break-words whitespace-pre-wrap text-fail">{error.message}</p>
      {line !== null && (
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-panel">
          <div className="flex items-center gap-2 border-b border-line px-3 py-1.5 text-xs text-muted">
            <span className="font-mono">solution.py</span>
            <span>
              line {line}
              {error.column ? `, column ${error.column}` : ''}
            </span>
            {onJump ? (
              <button
                type="button"
                onClick={() => onJump(line)}
                className="ml-auto rounded px-1 text-focus hover:underline"
              >
                Go to line
              </button>
            ) : (
              <span className="ml-auto">Code changed since this run</span>
            )}
          </div>
          {error.code !== undefined && error.code !== '' && (
            <pre className="scroll-thin overflow-x-auto px-3 py-2 font-mono text-[13px] leading-relaxed">
              <span className="mr-3 inline-block w-6 text-right text-muted select-none">{line}</span>
              {error.code}
              {error.column ? (
                <>
                  {'\n'}
                  <span className="mr-3 inline-block w-6 select-none" />
                  <span className="text-fail">{' '.repeat(Math.max(0, error.column - 1))}^</span>
                </>
              ) : null}
            </pre>
          )}
        </div>
      )}
      {error.frames && error.frames.length > 0 && (
        <div className="mt-3">
          <Frames frames={error.frames} onJump={onJump} />
        </div>
      )}
      <p className="mt-3 text-[13px] text-muted">Fix the error, then run again.</p>
    </Banner>
  )
}

export function TimeoutBanner() {
  return (
    <Banner icon={<TimerOff size={16} aria-hidden />} title={`Stopped after ${RUN_TIMEOUT_MS / 1000} seconds.`}>
      <p className="mt-1 text-[13px] text-muted">Check for an infinite loop — Python was restarted.</p>
    </Banner>
  )
}

export function CrashBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Banner icon={<CircleAlert size={16} aria-hidden />} title="Python stopped before the run finished">
      <p className="mt-1.5 font-mono text-[13px] break-words text-fail">{message}</p>
      <p className="mt-2 text-[13px] text-muted">This is usually temporary. Try the run again; Python restarts if needed.</p>
      <Button size="sm" className="mt-3" onClick={onRetry} icon={<RotateCcw size={14} aria-hidden />}>
        Try again
      </Button>
    </Banner>
  )
}
