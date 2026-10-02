import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { tabIds } from './tabIds'

export interface TabDef<T extends string> {
  id: T
  label: ReactNode
}

interface Props<T extends string> {
  tabs: TabDef<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
  className?: string
}

/** WAI-ARIA tabs with roving focus (arrow keys, Home, End). */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix, className = '' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={`flex items-stretch gap-1 ${className}`}>
      {tabs.map((t, i) => {
        const selected = t.id === value
        const ids = tabIds(idPrefix, t.id)
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={ids.tab}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative inline-flex items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors focus-visible:-outline-offset-2 ${
              selected
                ? 'text-text after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-text'
                : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
