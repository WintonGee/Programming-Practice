/** "4:05", "1:02:09" from a duration in ms. Negative durations are formatted by magnitude. */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** "45 min", "1 h 20 min" for summaries. */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 1) return 'under a minute'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "just now", "5 minutes ago", "yesterday". */
export function formatRelative(then: number, now: number): string {
  const sec = Math.round((then - now) / 1000)
  if (Math.abs(sec) < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (Math.abs(min) < 60) return rtf.format(min, 'minute')
  const hr = Math.round(min / 60)
  if (Math.abs(hr) < 24) return rtf.format(hr, 'hour')
  return rtf.format(Math.round(hr / 24), 'day')
}

/** "stage 1" or "stages 1–3". */
export const stagesThrough = (n: number) => (n <= 1 ? 'stage 1' : `stages 1–${n}`)
