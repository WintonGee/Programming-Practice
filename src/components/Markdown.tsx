import { isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HighlightedCode } from '../editor/HighlightedCode'

function codeText(children: ReactNode): { text: string; lang: string } | null {
  if (!isValidElement(children)) return null
  const el = children as ReactElement<{ className?: string; children?: ReactNode }>
  const lang = /language-(\w+)/.exec(el.props.className ?? '')?.[1] ?? ''
  const text = String(el.props.children ?? '').replace(/\n$/, '')
  return { text, lang }
}

const components: Components = {
  pre({ children }) {
    const code = codeText(children)
    if (code && (code.lang === 'python' || code.lang === 'py')) {
      return (
        <pre>
          <HighlightedCode code={code.text} />
        </pre>
      )
    }
    return <pre>{children}</pre>
  },
  table({ children }) {
    return (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    )
  },
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-stage">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
