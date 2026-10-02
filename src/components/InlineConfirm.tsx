import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'primary'
}

/** Replaces a trigger button in place; Escape cancels. Focus moves to Cancel so Enter is never destructive by accident. */
export function InlineConfirm({ message, confirmLabel, onConfirm, onCancel, tone = 'danger' }: Props) {
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => cancel.current?.focus(), [])
  return (
    <div
      role="group"
      aria-label="Confirm"
      className="flex flex-wrap items-center gap-2"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <span className="text-[13px] text-text">{message}</span>
      <Button size="sm" variant={tone} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} ref={cancel}>
        Cancel
      </Button>
    </div>
  )
}
