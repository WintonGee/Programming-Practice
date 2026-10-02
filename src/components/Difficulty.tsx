import type { Difficulty as Level } from '../types'

const color: Record<Level, string> = {
  Easy: 'text-easy',
  Medium: 'text-medium',
  Hard: 'text-hard',
}

export function Difficulty({ level, className = '' }: { level: Level; className?: string }) {
  return <span className={`text-[13px] font-medium ${color[level]} ${className}`}>{level}</span>
}
