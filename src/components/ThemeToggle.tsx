import { Moon, Sun } from 'lucide-react'
import { toggleTheme, useTheme } from '../state/theme'
import { IconButton } from './Button'

export function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton label={`Switch to ${next} theme`} onClick={toggleTheme}>
      {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </IconButton>
  )
}
