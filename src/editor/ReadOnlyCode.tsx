import { python } from '@codemirror/lang-python'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { editorTheme } from './theme'

const setup = {
  lineNumbers: true,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  autocompletion: false,
  syntaxHighlighting: false,
  searchKeymap: true,
}

/** Read-only, line-numbered Python with the editor's theme. */
export function ReadOnlyCode({ code, label }: { code: string; label: string }) {
  const extensions = useMemo(
    () => [
      python(),
      editorTheme,
      EditorState.readOnly.of(true),
      EditorView.contentAttributes.of({ 'aria-label': label }),
      EditorView.theme({ '&': { fontSize: '12.5px' }, '.cm-content': { caretColor: 'transparent' } }),
    ],
    [label],
  )
  return <CodeMirror value={code} theme="none" basicSetup={setup} editable extensions={extensions} />
}
