export type Variant = 'primary' | 'success' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-amber-fill text-amber-ink hover:brightness-110 active:brightness-95 font-semibold',
  success: 'bg-pass-fill text-pass-ink hover:brightness-110 active:brightness-95 font-semibold',
  secondary: 'bg-raised text-text border border-line hover:border-line-strong font-medium',
  ghost: 'text-muted hover:text-text hover:bg-raised font-medium',
  danger: 'bg-fail-soft text-fail border border-fail/50 hover:border-fail font-semibold',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[13px] gap-1.5 rounded-md',
  md: 'h-8 px-3 text-sm gap-2 rounded-md',
}

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', extra = '') =>
  `inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,filter] duration-100 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`
