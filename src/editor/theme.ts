import { syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { highlighter } from './highlight'

/** One theme for both color schemes: every color is a CSS variable swapped by [data-theme]. */
const base = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--c-text)',
    backgroundColor: 'var(--c-panel)',
    fontSize: '13.5px',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.65',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--c-line-strong) transparent',
  },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--c-amber)' },
  '.cm-line': { padding: '0 16px 0 8px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--c-amber)', borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--c-selection)' },
  '.cm-activeLine': { backgroundColor: 'var(--c-active-line)' },
  '.cm-gutters': {
    backgroundColor: 'var(--c-panel)',
    color: 'var(--c-muted)',
    border: 'none',
    paddingLeft: '6px',
  },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '28px', padding: '0 6px 0 0', opacity: '0.75' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--c-text)' },
  '.cm-activeLineGutter.cm-gutterElement': { opacity: '1' },
  '.cm-foldGutter .cm-gutterElement': { color: 'var(--c-muted)', padding: '0 4px' },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: 'transparent',
    outline: '1px solid var(--c-line-strong)',
    borderRadius: '2px',
  },
  '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: 'var(--c-fail-soft)' },
  '.cm-selectionMatch': { backgroundColor: 'var(--c-amber-soft)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--c-raised)',
    border: '1px solid var(--c-line)',
    color: 'var(--c-muted)',
    padding: '0 6px',
    borderRadius: '4px',
  },
  '.cm-panels': { backgroundColor: 'var(--c-raised)', color: 'var(--c-text)' },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--c-line)' },
  '.cm-panels.cm-panels-top': { borderBottom: '1px solid var(--c-line)' },
  '.cm-panel input, .cm-panel button': { fontFamily: 'var(--font-sans)', fontSize: '12px' },
  '.cm-textfield': {
    backgroundColor: 'var(--c-panel)',
    border: '1px solid var(--c-line)',
    borderRadius: '4px',
    color: 'var(--c-text)',
  },
  '.cm-button': {
    backgroundImage: 'none',
    backgroundColor: 'var(--c-panel)',
    border: '1px solid var(--c-line)',
    borderRadius: '4px',
    color: 'var(--c-text)',
  },
  '.cm-searchMatch': { backgroundColor: 'var(--c-amber-soft)', outline: '1px solid var(--c-amber)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--c-raised)',
    border: '1px solid var(--c-line)',
    borderRadius: '6px',
    color: 'var(--c-text)',
    fontFamily: 'var(--font-sans)',
  },
  '.cm-tooltip-lint': { padding: '0' },
  '.cm-diagnostic': { padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px' },
  '.cm-diagnostic-error': { borderLeft: '3px solid var(--c-fail)' },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--c-fail)',
    textUnderlineOffset: '3px',
  },
  '.cm-lint-marker-error': { content: 'none' },
  '.cm-gutter-lint': { width: '10px' },
  '.cm-gutter-lint .cm-gutterElement': { padding: '0' },
  '.cm-line.cm-errorLine': { backgroundColor: 'var(--c-fail-soft)' },
  '.cm-line.cm-flashLine': { backgroundColor: 'var(--c-amber-soft)', transition: 'background-color 1.2s ease' },
})

export const editorTheme: Extension = [base, syntaxHighlighting(highlighter)]
