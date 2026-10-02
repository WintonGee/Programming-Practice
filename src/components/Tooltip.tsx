import type { ReactNode } from 'react'

/** Hover/focus label for controls whose shortcut is worth surfacing. */
export function Tooltip({ label, children, align = 'center' }: { label: ReactNode; children: ReactNode; align?: 'center' | 'end' }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md border border-line bg-raised px-2 py-1 text-xs text-text opacity-0 shadow-lg shadow-black/20 transition-opacity delay-0 group-hover/tip:opacity-100 group-hover/tip:delay-300 group-has-[:focus-visible]/tip:opacity-100 ${
          align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {label}
      </span>
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ml-1.5 font-mono text-[11px] text-muted">{children}</kbd>
}
