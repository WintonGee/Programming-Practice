import { useSyncExternalStore } from 'react'
import { safeStorage } from './storage'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'staged:theme'
const listeners = new Set<() => void>()

const systemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

function storedTheme(): Theme | null {
  const v = safeStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141B2D' : '#F5F7FB')
  for (const l of listeners) l()
}

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

/** Follow the OS setting until the user picks a theme explicitly. */
export function initTheme() {
  apply(storedTheme() ?? systemTheme())
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!storedTheme()) apply(systemTheme())
  })
}

export function toggleTheme() {
  const next: Theme = read() === 'dark' ? 'light' : 'dark'
  safeStorage.setItem(THEME_KEY, next)
  apply(next)
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    read,
    () => 'dark',
  )
}
