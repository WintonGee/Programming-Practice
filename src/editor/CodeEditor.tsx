import { python } from '@codemirror/lang-python'
import { indentUnit } from '@codemirror/language'
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import { EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import { flashLine, lineMarks, setErrorLine } from './errorLine'
import { editorTheme } from './theme'

export interface CodeEditorHandle {
  jumpTo(line: number): void
  showError(error: { line: number; column?: number | null; message: string } | null): void
  focus(): void
}

interface Props {
  value: string
  onChange: (value: string) => void
  ref?: Ref<CodeEditorHandle>
}

const setup = {
  lineNumbers: true,
  foldGutter: true,
  highlightActiveLine: true,
  highlightActiveLineGutter: true,
  bracketMatching: true,
  closeBrackets: true,
  indentOnInput: true,
  history: true,
  autocompletion: false,
  highlightSelectionMatches: true,
  syntaxHighlighting: false,
  tabSize: 4,
}

export function CodeEditor({ value, onChange, ref }: Props) {
  const cm = useRef<ReactCodeMirrorRef>(null)

  const extensions = useMemo(
    () => [
      python(),
      editorTheme,
      EditorState.tabSize.of(4),
      indentUnit.of('    '),
      lintGutter(),
      lineMarks,
      // Run shortcuts are handled by a window listener; claim them here so the default keymap doesn't insert a line.
      Prec.highest(
        keymap.of([
          { key: 'Mod-Enter', run: () => true },
          { key: 'Shift-Mod-Enter', run: () => true },
        ]),
      ),
      EditorView.contentAttributes.of({ 'aria-label': 'Solution code editor' }),
    ],
    [],
  )

  useImperativeHandle(
    ref,
    () => ({
      jumpTo(line) {
        const view = cm.current?.view
        if (!view) return
        const n = Math.min(Math.max(1, line), view.state.doc.lines)
        const pos = view.state.doc.line(n).from
        view.dispatch({
          selection: { anchor: pos },
          effects: [EditorView.scrollIntoView(pos, { y: 'center' }), flashLine.of(n)],
        })
        view.focus()
      },
      showError(error) {
        const view = cm.current?.view
        if (!view) return
        if (!error || error.line > view.state.doc.lines || error.line < 1) {
          view.dispatch(setDiagnostics(view.state, []), { effects: setErrorLine.of(null) })
          return
        }
        const line = view.state.doc.line(error.line)
        const col = Math.max(0, (error.column ?? 1) - 1)
        const from = Math.min(line.from + col, line.to)
        const diagnostic: Diagnostic = {
          from,
          to: from < line.to ? line.to : from,
          severity: 'error',
          message: error.message,
        }
        view.dispatch(setDiagnostics(view.state, [diagnostic]), {
          effects: [setErrorLine.of(error.line), EditorView.scrollIntoView(line.from, { y: 'nearest' })],
        })
      },
      focus() {
        cm.current?.view?.focus()
      },
    }),
    [],
  )

  return (
    <CodeMirror
      ref={cm}
      value={value}
      onChange={onChange}
      height="100%"
      className="h-full"
      theme="none"
      basicSetup={setup}
      extensions={extensions}
    />
  )
}
