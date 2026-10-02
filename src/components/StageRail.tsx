import { Check, Lock } from 'lucide-react'
import { railSummary, stateLabel, type RailStage } from '../lib/rail'

interface Props {
  stages: RailStage[]
  /** Stage whose segment should sweep to filled (just completed and continued). */
  fillStage?: number | null
  /** Stage that was just unlocked; pulses once after the fill. */
  arriveStage?: number | null
  className?: string
}

/** The progress ladder: one segment per stage, filled as stages pass. */
export function StageRail({ stages, fillStage, arriveStage, className = '' }: Props) {
  return (
    <ol className={`flex items-center gap-1 ${className}`} aria-label={railSummary(stages)}>
      {stages.map((s) => {
        const filled = s.state === 'passed'
        return (
          <li
            key={s.number}
            title={`Stage ${s.number}: ${s.title} (${stateLabel[s.state]})`}
            aria-label={`Stage ${s.number}, ${s.title}, ${stateLabel[s.state]}`}
            data-state={s.state}
            className={`relative flex h-6 w-11 items-center justify-center overflow-hidden rounded-[5px] border text-[11px] font-semibold tabular-nums first:rounded-l-lg last:rounded-r-lg ${
              filled
                ? 'border-pass-fill text-pass-ink'
                : s.state === 'locked'
                  ? 'border-line bg-raised/60 text-muted'
                  : 'border-amber bg-amber-soft text-amber-text'
            } ${arriveStage === s.number ? 'rail-arrive' : ''}`}
          >
            {filled && (
              <span
                aria-hidden
                className={`absolute inset-0 bg-pass-fill ${fillStage === s.number ? 'rail-fill-in' : ''}`}
              />
            )}
            <span className="relative flex items-center gap-0.5" aria-hidden>
              {s.state === 'locked' ? (
                <Lock size={11} strokeWidth={2.25} />
              ) : s.state === 'passed' || s.state === 'ready' ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  {s.number}
                </>
              ) : (
                s.number
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Dense variant for lists: thin bars, no icons. */
export function CompactRail({ stages }: { stages: RailStage[] }) {
  return (
    <ol className="flex items-center gap-[3px]" aria-label={railSummary(stages)}>
      {stages.map((s) => (
        <li
          key={s.number}
          title={`Stage ${s.number}: ${s.title} (${stateLabel[s.state]})`}
          className={`h-1.5 w-5 rounded-full ${
            s.state === 'passed'
              ? 'bg-pass'
              : s.state === 'ready' || s.state === 'current'
                ? 'bg-amber'
                : 'bg-line-strong/70'
          }`}
        />
      ))}
    </ol>
  )
}
