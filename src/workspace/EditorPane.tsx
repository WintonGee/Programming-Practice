import { Flag, RotateCcw, SquareTerminal } from 'lucide-react'
import { useState, type Ref } from 'react'
import { Button, IconButton } from '../components/Button'
import { InlineConfirm } from '../components/InlineConfirm'
import { CodeEditor, type CodeEditorHandle } from '../editor/CodeEditor'

interface Props {
  code: string
  onChange: (code: string) => void
  saving: boolean
  onRunFile: () => void
  onResetCode: () => void
  onStartOver: () => void
  running: boolean
  mobile: boolean
  editorRef: Ref<CodeEditorHandle>
}

export function EditorPane({
  code,
  onChange,
  saving,
  onRunFile,
  onResetCode,
  onStartOver,
  running,
  mobile,
  editorRef,
}: Props) {
  const [confirm, setConfirm] = useState<'reset' | 'restart' | null>(null)

  return (
    <section aria-label="Code" className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-1 pr-2 pl-4">
        <span className="font-mono text-[13px] text-text">solution.py</span>
        <span className="text-xs text-muted" aria-live="polite">
          {saving ? 'Saving…' : 'Saved'}
        </span>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          {confirm === 'reset' ? (
            <InlineConfirm
              message="Replace your code with the starter?"
              confirmLabel="Reset code"
              onConfirm={() => {
                setConfirm(null)
                onResetCode()
              }}
              onCancel={() => setConfirm(null)}
            />
          ) : confirm === 'restart' ? (
            <InlineConfirm
              message="Start a new attempt from stage 1?"
              confirmLabel="Start over"
              onConfirm={() => {
                setConfirm(null)
                onStartOver()
              }}
              onCancel={() => setConfirm(null)}
            />
          ) : (
            <>
              {!mobile && (
                <span className="mr-2 hidden text-xs text-muted 2xl:inline">Tab indents. Press Esc then Tab to leave the editor.</span>
              )}
              {mobile && (
                <Button size="sm" variant="ghost" onClick={onRunFile} disabled={running} icon={<SquareTerminal size={14} aria-hidden />}>
                  Run file
                </Button>
              )}
              {mobile ? (
                <>
                  <IconButton label="Reset code" onClick={() => setConfirm('reset')}>
                    <RotateCcw size={15} aria-hidden />
                  </IconButton>
                  <IconButton label="Start over" onClick={() => setConfirm('restart')}>
                    <Flag size={15} aria-hidden />
                  </IconButton>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm('reset')} icon={<RotateCcw size={14} aria-hidden />}>
                    Reset code
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm('restart')} icon={<Flag size={14} aria-hidden />}>
                    Start over
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor ref={editorRef} value={code} onChange={onChange} />
      </div>
    </section>
  )
}
