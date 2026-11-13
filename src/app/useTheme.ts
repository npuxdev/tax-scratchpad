import { useCallback, useEffect, useState } from 'react'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  oppositeTheme,
  persistTheme,
  readInitialTheme,
  resolveTheme,
  type ColorScheme,
} from './theme'

export function useTheme(): {
  theme: ColorScheme
  setTheme: (theme: ColorScheme) => void
  toggleTheme: () => void
} {
  const [theme, setThemeState] = useState<ColorScheme>(readInitialTheme)

  const setTheme = useCallback((next: ColorScheme) => {
    applyTheme(next)
    persistTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(oppositeTheme(theme))
  }, [setTheme, theme])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = resolveTheme(event.newValue)
      applyTheme(next)
      setThemeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { theme, setTheme, toggleTheme }
}
