import { isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
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

const plain = { remark: [remarkGfm], rehype: [] }
const withMath = { remark: [remarkGfm, remarkMath], rehype: [rehypeKatex] }

/** `math` renders $…$ LaTeX with KaTeX; model answers use it, authored problem content does not. */
export function Markdown({ source, math = false }: { source: string; math?: boolean }) {
  const plugins = math ? withMath : plain
  return (
    <div className="prose-stage">
      <ReactMarkdown remarkPlugins={plugins.remark} rehypePlugins={plugins.rehype} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
