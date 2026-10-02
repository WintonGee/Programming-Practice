import { pythonLanguage } from '@codemirror/lang-python'
import { highlightCode } from '@lezer/highlight'
import { useMemo, type ReactNode } from 'react'
import { highlighter } from './highlight'

/** Static syntax highlighting for Python snippets in prompts; no editor instance needed. */
export function HighlightedCode({ code }: { code: string }) {
  const nodes = useMemo(() => {
    const out: ReactNode[] = []
    const tree = pythonLanguage.parser.parse(code)
    highlightCode(
      code,
      tree,
      highlighter,
      (text, classes) => out.push(classes ? <span key={out.length} className={classes}>{text}</span> : text),
      () => out.push('\n'),
    )
    return out
  }, [code])
  return <code>{nodes}</code>
}
