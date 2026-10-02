import type { TraceFrame } from '../../types'

/** Traceback frames, innermost last. solution.py frames jump the editor to that line. */
/** Without `onJump` (the editor changed since the run) frames render as plain text. */
export function Frames({ frames, onJump }: { frames: TraceFrame[]; onJump?: (line: number) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted">Traceback</p>
      <ol className="overflow-hidden rounded-md border border-line bg-panel font-mono text-[12.5px]">
        {frames.map((f, i) => {
          const own = f.file === 'solution.py'
          const location = (
            <>
              <span className={own ? 'text-text' : 'text-muted'}>{f.file}</span>
              <span className="text-muted">, line {f.line}, in </span>
              <span className="text-text">{f.function}</span>
            </>
          )
          return (
            <li key={i} className="border-t border-line first:border-t-0">
              {own && onJump ? (
                <button
                  type="button"
                  onClick={() => onJump(f.line)}
                  title={`Go to line ${f.line} in solution.py`}
                  className="block w-full px-3 py-1.5 text-left hover:bg-raised focus-visible:-outline-offset-2"
                >
                  <span className="block truncate underline decoration-line-strong underline-offset-2">{location}</span>
                  {f.code && <span className="block truncate pl-3 text-muted">{f.code}</span>}
                </button>
              ) : (
                <div className="px-3 py-1.5">
                  <span className="block truncate">{location}</span>
                  {f.code && <span className="block truncate pl-3 text-muted">{f.code}</span>}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
