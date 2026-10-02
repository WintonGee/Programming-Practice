import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { buttonClass, type Size, type Variant } from './buttonClass'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant, size, icon, className = '', children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({ label, children, className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
