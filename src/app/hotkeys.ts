/**
 * Keyboard interaction model (Linear-style).
 *
 * 1. Unmodified letters fire the common actions — N, T, D, E, I, # —
 *    but only when you are not typing in a field. That keeps shortcuts
 *    out of the way of names, amounts, and search.
 * 2. Go-to is a two-key sequence, like Linear's G then I: press G, then
 *    S / F / B within a second. A small "Go to" hint lists the next keys.
 * 3. ⌘K (Ctrl+K) is the command palette. It works even while typing, so
 *    it is always an escape hatch. Each action in the palette shows its
 *    shortcut so the palette teaches the keys.
 * 4. ? opens the searchable shortcut overlay. ⌘/ does the same even
 *    while typing. Esc closes overlays.
 * 5. Destructive keys never act immediately. Delete and Reset all open
 *    a confirm dialog; Esc or Cancel backs out.
 *
 * Browser collisions are avoided by preferring unmodified letters over
 * ⌘N / ⌘T, and by treating Ctrl as ⌘ on Windows and Linux.
 */

export type ShortcutGroupId = 'general' | 'go' | 'create' | 'scenario'

export interface KeyCombo {
  /** Normalized key: a letter, '?', '#', 'backspace', '/', etc. */
  key: string
  /** ⌘ on Apple, Ctrl elsewhere. Matched against metaKey OR ctrlKey. */
  meta?: boolean
  shift?: boolean
  alt?: boolean
}

export interface Shortcut {
  id: ShortcutId
  group: ShortcutGroupId
  /** Short name in the overlay and command palette. */
  label: string
  /** One-line explanation of what happens. */
  description: string
  sequence: KeyCombo[]
  /**
   * Fires even when focus is in an input. Reserved for global
   * overlays (palette, shortcut help) so they stay reachable.
   */
  allowInInput?: boolean
  /** Fires while a dialog is open — typically to toggle that dialog. */
  allowInDialog?: boolean
}

export type ShortcutId =
  | 'command'
  | 'shortcuts'
  | 'shortcuts-alt'
  | 'add-form'
  | 'toggle-view'
  | 'go-scratchpad'
  | 'go-form'
  | 'go-basics'
  | 'duplicate'
  | 'compare'
  | 'export'
  | 'import'
  | 'delete'
  | 'reset'

export const SHORTCUT_GROUPS: Array<{ id: ShortcutGroupId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'go', label: 'Go to' },
  { id: 'create', label: 'Create' },
  { id: 'scenario', label: 'Scenario' },
]

/** Time window to complete a G-then-X sequence, in milliseconds. */
export const CHORD_TIMEOUT_MS = 1000

/**
 * Canonical catalog. The overlay, command palette, and listener all
 * read from this list so the documented keys always match behavior.
 */
export const SHORTCUTS: Shortcut[] = [
  {
    id: 'command',
    group: 'general',
    label: 'Command palette',
    description: 'Jump to any form, field, or action',
    sequence: [{ key: 'k', meta: true }],
    allowInInput: true,
    allowInDialog: true,
  },
  {
    id: 'shortcuts',
    group: 'general',
    label: 'Keyboard shortcuts',
    description: 'Open this reference',
    sequence: [{ key: '?' }],
    allowInDialog: true,
  },
  {
    id: 'shortcuts-alt',
    group: 'general',
    label: 'Keyboard shortcuts',
    description: 'Open this reference, even while typing',
    sequence: [{ key: '/', meta: true }],
    allowInInput: true,
    allowInDialog: true,
  },
  {
    id: 'toggle-view',
    group: 'go',
    label: 'Toggle Scratchpad / Form',
    description: 'Switch the working plane',
    sequence: [{ key: 't' }],
  },
  {
    id: 'go-scratchpad',
    group: 'go',
    label: 'Scratchpad',
    description: 'Open the Scratchpad view',
    sequence: [{ key: 'g' }, { key: 's' }],
  },
  {
    id: 'go-form',
    group: 'go',
    label: 'Form',
    description: 'Open the Form view',
    sequence: [{ key: 'g' }, { key: 'f' }],
  },
  {
    id: 'go-basics',
    group: 'go',
    label: 'Basics',
    description: 'Jump to the Basics input screen',
    sequence: [{ key: 'g' }, { key: 'b' }],
  },
  {
    id: 'add-form',
    group: 'create',
    label: 'Add form',
    description: 'Add a W-2, 1099, or schedule',
    sequence: [{ key: 'n' }],
  },
  {
    id: 'duplicate',
    group: 'scenario',
    label: 'Duplicate scenario',
    description: 'Copy this scenario and rename it',
    sequence: [{ key: 'd' }],
  },
  {
    id: 'compare',
    group: 'scenario',
    label: 'Compare scenarios',
    description: 'Select two or more scenarios and compare differences',
    sequence: [{ key: 'c' }],
  },
  {
    id: 'export',
    group: 'scenario',
    label: 'Export JSON',
    description: 'Download this scenario as a JSON file',
    sequence: [{ key: 'e' }],
  },
  {
    id: 'import',
    group: 'scenario',
    label: 'Import JSON',
    description: 'Open a scenario from a JSON file',
    sequence: [{ key: 'i' }],
  },
  {
    id: 'delete',
    group: 'scenario',
    label: 'Delete scenario',
    description: 'Remove this scenario after confirming',
    sequence: [{ key: '#' }],
  },
  {
    id: 'reset',
    group: 'scenario',
    label: 'Reset all',
    description: 'Clear every form and input after confirming',
    sequence: [{ key: 'r' }],
  },
]

const BY_ID = new Map(SHORTCUTS.map((item) => [item.id, item]))

export function getShortcut(id: ShortcutId): Shortcut {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown shortcut: ${id}`)
  return found
}

/** Keys that are produced with Shift on a US keyboard; shift is not a modifier. */
const SHIFT_GLYPHS = new Set(['?', '#', '!', '@', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '~'])

export function normalizeKey(key: string): string {
  if (key === ' ') return 'space'
  if (key.length === 1) return key.toLowerCase()
  return key.toLowerCase()
}

export function comboMatchesEvent(combo: KeyCombo, event: KeyboardEventLike): boolean {
  if (normalizeKey(event.key) !== combo.key) return false

  const eventMeta = event.metaKey || event.ctrlKey
  if (Boolean(combo.meta) !== eventMeta) return false
  if (Boolean(combo.alt) !== event.altKey) return false

  if (!SHIFT_GLYPHS.has(combo.key) && Boolean(combo.shift) !== event.shiftKey) {
    return false
  }

  return true
}

export interface KeyboardEventLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export interface MatchResult {
  /** Fully matched shortcut, if any. */
  hit: Shortcut | null
  /**
   * Shortcuts whose first keys matched and still need more keys.
   * Used to keep the G-prefix alive and to show the "Go to" hint.
   */
  pending: Shortcut[]
}

/**
 * Match a key against the catalog, optionally continuing a chord.
 * `consumed` is the combos already accepted in this sequence.
 */
export function matchShortcuts(
  event: KeyboardEventLike,
  consumed: KeyCombo[],
  shortcuts: Shortcut[] = SHORTCUTS,
): MatchResult {
  const nextIndex = consumed.length
  const hitCandidates: Shortcut[] = []
  const pending: Shortcut[] = []

  for (const shortcut of shortcuts) {
    const combo = shortcut.sequence[nextIndex]
    if (!combo) continue
    if (nextIndex > 0 && !sequencePrefixMatches(shortcut.sequence, consumed)) {
      continue
    }
    if (!comboMatchesEvent(combo, event)) continue

    if (nextIndex === shortcut.sequence.length - 1) {
      hitCandidates.push(shortcut)
    } else {
      pending.push(shortcut)
    }
  }

  // Prefer the longest completed sequence so a lone key doesn't steal
  // from a chord that also ends here (none do today, but keep it safe).
  hitCandidates.sort((a, b) => b.sequence.length - a.sequence.length)

  return { hit: hitCandidates[0] ?? null, pending }
}

function sequencePrefixMatches(sequence: KeyCombo[], consumed: KeyCombo[]): boolean {
  return consumed.every((combo, index) => combosEqual(sequence[index], combo))
}

function combosEqual(a: KeyCombo | undefined, b: KeyCombo): boolean {
  if (!a) return false
  return (
    a.key === b.key &&
    Boolean(a.meta) === Boolean(b.meta) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt)
  )
}

export function eventToCombo(event: KeyboardEventLike): KeyCombo {
  const key = normalizeKey(event.key)
  return {
    key,
    meta: event.metaKey || event.ctrlKey || undefined,
    shift: SHIFT_GLYPHS.has(key) ? undefined : event.shiftKey || undefined,
    alt: event.altKey || undefined,
  }
}

const EDITABLE_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'number',
  'password',
  'tel',
  'url',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
  '',
])

/** True when the event target is a field the user is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly
  }
  if (target instanceof HTMLSelectElement) {
    return !target.disabled
  }
  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) return false
    return EDITABLE_INPUT_TYPES.has(target.type)
  }
  if (target.isContentEditable) return true
  return Boolean(target.closest('[contenteditable="true"]'))
}

export function hasOpenDialog(root: ParentNode = document): boolean {
  return Boolean(root.querySelector('dialog[open]'))
}

export function isApplePlatform(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): boolean {
  return /Mac|iPhone|iPad|iPod/.test(userAgent)
}

const KEY_GLYPHS: Record<string, string> = {
  backspace: '⌫',
  escape: 'Esc',
  enter: '↵',
  tab: 'Tab',
  space: 'Space',
  meta: '⌘',
  shift: '⇧',
  alt: '⌥',
}

export function displayKey(key: string, apple = true): string {
  if (key === 'meta') return apple ? '⌘' : 'Ctrl'
  if (key === 'shift') return apple ? '⇧' : 'Shift'
  if (key === 'alt') return apple ? '⌥' : 'Alt'
  return KEY_GLYPHS[key] ?? key.toUpperCase()
}

export function formatCombo(combo: KeyCombo, apple = true): string[] {
  const parts: string[] = []
  if (combo.meta) parts.push(displayKey('meta', apple))
  if (combo.shift) parts.push(displayKey('shift', apple))
  if (combo.alt) parts.push(displayKey('alt', apple))
  parts.push(displayKey(combo.key, apple))
  return parts
}

export function formatSequence(sequence: KeyCombo[], apple = true): string {
  return sequence.map((combo) => formatCombo(combo, apple).join(apple ? '' : '+')).join(' then ')
}

export function shortcutCaption(id: ShortcutId, apple = isApplePlatform()): string {
  const shortcut = getShortcut(id)
  return `${shortcut.label} (${formatSequence(shortcut.sequence, apple)})`
}

/** Overlay lists one row per action; ⌘/ is an alias of ?, so hide the alias. */
export function shortcutsForOverlay(): Shortcut[] {
  return SHORTCUTS.filter((item) => item.id !== 'shortcuts-alt')
}

export function shortcutsInGroup(group: ShortcutGroupId): Shortcut[] {
  return shortcutsForOverlay().filter((item) => item.group === group)
}

export function filterShortcuts(query: string, shortcuts: Shortcut[] = shortcutsForOverlay()): Shortcut[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return shortcuts
  return shortcuts.filter((item) => {
    const keys = formatSequence(item.sequence, true).toLowerCase()
    const keysWin = formatSequence(item.sequence, false).toLowerCase()
    return (
      item.label.toLowerCase().includes(needle) ||
      item.description.toLowerCase().includes(needle) ||
      item.group.toLowerCase().includes(needle) ||
      keys.includes(needle) ||
      keysWin.toLowerCase().includes(needle) ||
      item.sequence.some((combo) => combo.key.includes(needle))
    )
  })
}
