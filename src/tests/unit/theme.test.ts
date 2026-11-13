import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  THEME_COLOR,
  THEME_STORAGE_KEY,
  applyTheme,
  oppositeTheme,
  parseStoredTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
} from '../../app/theme'

describe('theme', () => {
  it('defaults to dark and treats anything else as unset', () => {
    expect(DEFAULT_THEME).toBe('dark')
    expect(parseStoredTheme('dark')).toBe('dark')
    expect(parseStoredTheme('light')).toBe('light')
    expect(parseStoredTheme('system')).toBeNull()
    expect(parseStoredTheme(null)).toBeNull()
    expect(resolveTheme(null)).toBe('dark')
    expect(resolveTheme('nope')).toBe('dark')
  })

  it('toggles between the two schemes', () => {
    expect(oppositeTheme('dark')).toBe('light')
    expect(oppositeTheme('light')).toBe('dark')
  })

  it('reads and writes the stored scheme', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }

    expect(readStoredTheme(storage)).toBeNull()
    persistTheme('light', storage)
    expect(store.get(THEME_STORAGE_KEY)).toBe('light')
    expect(readStoredTheme(storage)).toBe('light')
  })

  it('sets data-theme and the theme-color meta', () => {
    const attrs: Record<string, string> = {}
    const root = {
      setAttribute: (name: string, value: string) => {
        attrs[name] = value
      },
    }
    const metaAttrs: Record<string, string> = {}
    const meta = {
      setAttribute: (name: string, value: string) => {
        metaAttrs[name] = value
      },
    }

    applyTheme('light', { root, themeColorMeta: meta })
    expect(attrs['data-theme']).toBe('light')
    expect(metaAttrs.content).toBe(THEME_COLOR.light)

    applyTheme('dark', { root, themeColorMeta: meta })
    expect(attrs['data-theme']).toBe('dark')
    expect(metaAttrs.content).toBe(THEME_COLOR.dark)
  })
})
