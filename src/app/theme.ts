/**
 * Appearance is an explicit choice, not the OS preference.
 * Vlak paints dark when `data-theme="dark"` is on the root; without
 * an attribute it follows `prefers-color-scheme`, which is why Cursor's
 * browser (dark) and Chrome (light) used to disagree.
 *
 * Default is dark. The blocking `/theme.js` script applies the stored
 * value before paint so the first frame matches.
 */

export type ColorScheme = 'light' | 'dark'

/** Keep in sync with `public/theme.js`. */
export const THEME_STORAGE_KEY = 'tax-scratchpad-theme'

export const DEFAULT_THEME: ColorScheme = 'dark'

export const THEME_COLOR: Record<ColorScheme, string> = {
  light: '#FAF8F2',
  dark: '#0E0C0A',
}

export function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark'
}

export function parseStoredTheme(value: string | null | undefined): ColorScheme | null {
  return isColorScheme(value) ? value : null
}

export function resolveTheme(
  stored: string | null | undefined,
  fallback: ColorScheme = DEFAULT_THEME,
): ColorScheme {
  return parseStoredTheme(stored) ?? fallback
}

export function oppositeTheme(theme: ColorScheme): ColorScheme {
  return theme === 'dark' ? 'light' : 'dark'
}

export function readStoredTheme(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): ColorScheme | null {
  if (!storage) return null
  try {
    return parseStoredTheme(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export function persistTheme(
  theme: ColorScheme,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode or blocked storage — the in-memory scheme still applies.
  }
}

export function readDomTheme(
  root: Pick<HTMLElement, 'getAttribute'> | null = typeof document === 'undefined'
    ? null
    : document.documentElement,
): ColorScheme | null {
  return root ? parseStoredTheme(root.getAttribute('data-theme')) : null
}

export function readInitialTheme(): ColorScheme {
  return readDomTheme() ?? readStoredTheme() ?? DEFAULT_THEME
}

export function applyTheme(
  theme: ColorScheme,
  options?: {
    root?: Pick<HTMLElement, 'setAttribute'>
    themeColorMeta?: Pick<Element, 'setAttribute'> | null
  },
): void {
  const root =
    options?.root ?? (typeof document === 'undefined' ? null : document.documentElement)
  root?.setAttribute('data-theme', theme)

  const meta =
    options && 'themeColorMeta' in options
      ? options.themeColorMeta
      : typeof document === 'undefined'
        ? null
        : document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLOR[theme])
}
