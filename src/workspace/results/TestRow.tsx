import { ChevronRight, CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { useId, useState } from 'react'
import type { TestResult } from '../../types'
import { Frames } from './Frames'

const icons = {
  pass: <CircleCheck size={16} className="text-pass" aria-hidden />,
  fail: <CircleX size={16} className="text-fail" aria-hidden />,
  error: <CircleAlert size={16} className="text-fail" aria-hidden />,
}

const statusLabel = { pass: 'Passed', fail: 'Failed', error: 'Error' }

export function TestRow({ result, onJump }: { result: TestResult; onJump?: (line: number) => void }) {
  const failed = result.status !== 'pass'
  const hasDetail = failed || result.stdout !== ''
  const [open, setOpen] = useState(failed)
  const detailId = useId()
  const title = result.doc || result.name

  const head = (
    <>
      <span className="mt-px shrink-0">{icons[result.status]}</span>
      <span className="sr-only">{statusLabel[result.status]}:</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13.5px] leading-snug ${failed ? 'font-medium text-text' : 'text-text'}`}>{title}</span>
        {result.doc && <span className="mt-0.5 block truncate font-mono text-xs text-muted">{result.name}</span>}
      </span>
      {hasDetail && (
        <ChevronRight
          size={15}
          className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        />
      )}
    </>
  )

  return (
    <li className="border-t border-line first:border-t-0" data-status={result.status}>
      {hasDetail ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen(!open)}
          className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-raised/50 focus-visible:-outline-offset-2"
        >
          {head}
        </button>
      ) : (
        <div className="flex items-start gap-2.5 px-3 py-2">{head}</div>
      )}
      {hasDetail && open && (
        <div id={detailId} className="space-y-3 px-3 pb-3 pl-[38px]">
          {failed && (
            <p className="font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap text-fail">
              {result.message || 'Failed'}
            </p>
          )}
          {failed && result.code && (
            <div>
              <p className="mb-1 text-xs text-muted">
                Failing line in <span className="font-mono">stage{result.stage}_tests.py</span>
              </p>
              <pre className="scroll-thin overflow-x-auto rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[12.5px]">
                {result.line !== null && (
                  <span className="mr-3 inline-block w-6 text-right text-muted select-none">{result.line}</span>
                )}
                {result.code}
              </pre>
            </div>
          )}
          {result.frames.length > 0 && <Frames frames={result.frames} onJump={onJump} />}
          {result.stdout && (
            <div>
              <p className="mb-1 text-xs text-muted">Printed output</p>
              <pre className="scroll-thin max-h-48 overflow-auto rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[12.5px] whitespace-pre-wrap">
                {result.stdout}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
