import { describe, expect, it } from 'vitest'
import {
  SHORTCUTS,
  comboMatchesEvent,
  eventToCombo,
  filterShortcuts,
  formatSequence,
  getShortcut,
  isApplePlatform,
  matchShortcuts,
  shortcutsForOverlay,
  type KeyboardEventLike,
} from '../../app/hotkeys'
import { createEmptyScenario, createFormInstance, resetScenarioContents } from '../../state/scenario'

function key(
  key: string,
  mods: Partial<Pick<KeyboardEventLike, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>> = {},
): KeyboardEventLike {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  }
}

describe('hotkey catalog', () => {
  it('documents every required action exactly once', () => {
    const ids = SHORTCUTS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(
      expect.arrayContaining([
        'command',
        'shortcuts',
        'toggle-theme',
        'add-form',
        'toggle-view',
        'go-basics',
        'duplicate',
        'compare',
        'export',
        'import',
        'delete',
        'reset',
      ]),
    )
    for (const shortcut of SHORTCUTS) {
      expect(shortcut.label.length).toBeGreaterThan(0)
      expect(shortcut.description.length).toBeGreaterThan(0)
      expect(shortcut.sequence.length).toBeGreaterThan(0)
    }
  })

  it('hides the ⌘/ alias from the overlay so ? is the documented key', () => {
    const overlayIds = shortcutsForOverlay().map((item) => item.id)
    expect(overlayIds).toContain('shortcuts')
    expect(overlayIds).not.toContain('shortcuts-alt')
  })
})

describe('combo matching', () => {
  it('matches unmodified letters and ignores Shift+letter', () => {
    const add = getShortcut('add-form').sequence[0]
    expect(comboMatchesEvent(add, key('n'))).toBe(true)
    expect(comboMatchesEvent(add, key('N'))).toBe(true)
    expect(comboMatchesEvent(add, key('N', { shiftKey: true }))).toBe(false)
    expect(comboMatchesEvent(add, key('n', { metaKey: true }))).toBe(false)
  })

  it('treats Ctrl as ⌘ so Windows gets the same shortcuts', () => {
    const command = getShortcut('command').sequence[0]
    expect(comboMatchesEvent(command, key('k', { metaKey: true }))).toBe(true)
    expect(comboMatchesEvent(command, key('k', { ctrlKey: true }))).toBe(true)
    expect(comboMatchesEvent(command, key('k'))).toBe(false)
  })

  it('matches glyph keys that are typed with Shift', () => {
    expect(comboMatchesEvent(getShortcut('shortcuts').sequence[0], key('?'))).toBe(
      true,
    )
    expect(
      comboMatchesEvent(getShortcut('delete').sequence[0], key('#')),
    ).toBe(true)
  })

  it('matches Reset all as an unmodified R (confirm still required)', () => {
    const reset = getShortcut('reset').sequence[0]
    expect(comboMatchesEvent(reset, key('r'))).toBe(true)
    expect(comboMatchesEvent(reset, key('r', { metaKey: true }))).toBe(false)
    expect(comboMatchesEvent(reset, key('R', { shiftKey: true }))).toBe(false)
  })

  it('matches appearance as Shift+D without stealing Duplicate', () => {
    const appearance = getShortcut('toggle-theme').sequence[0]
    expect(comboMatchesEvent(appearance, key('d', { shiftKey: true }))).toBe(true)
    expect(comboMatchesEvent(appearance, key('D', { shiftKey: true }))).toBe(true)
    expect(comboMatchesEvent(appearance, key('d'))).toBe(false)

    const duplicate = getShortcut('duplicate').sequence[0]
    expect(comboMatchesEvent(duplicate, key('d'))).toBe(true)
    expect(comboMatchesEvent(duplicate, key('d', { shiftKey: true }))).toBe(false)
  })
})

describe('sequences', () => {
  it('completes G then B as Go to Basics', () => {
    const first = matchShortcuts(key('g'), [])
    expect(first.hit).toBeNull()
    expect(first.pending.map((item) => item.id).sort()).toEqual([
      'go-basics',
      'go-form',
      'go-scratchpad',
    ])

    const second = matchShortcuts(key('b'), [eventToCombo(key('g'))])
    expect(second.hit?.id).toBe('go-basics')
    expect(second.pending).toEqual([])
  })

  it('does not treat a lone G as an action', () => {
    expect(matchShortcuts(key('g'), []).hit).toBeNull()
  })
})

describe('formatting', () => {
  it('renders Apple and Windows glyphs', () => {
    expect(formatSequence(getShortcut('command').sequence, true)).toBe('⌘K')
    expect(formatSequence(getShortcut('command').sequence, false)).toBe('Ctrl+K')
    expect(formatSequence(getShortcut('go-basics').sequence, true)).toBe(
      'G then B',
    )
    expect(formatSequence(getShortcut('reset').sequence, true)).toBe('R')
    expect(formatSequence(getShortcut('toggle-theme').sequence, true)).toBe('⇧D')
    expect(formatSequence(getShortcut('toggle-theme').sequence, false)).toBe(
      'Shift+D',
    )
  })

  it('detects Apple platforms from the user agent', () => {
    expect(isApplePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)')).toBe(
      true,
    )
    expect(isApplePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      false,
    )
  })

  it('filters the overlay by label, description, and key', () => {
    expect(filterShortcuts('basics').map((item) => item.id)).toContain(
      'go-basics',
    )
    expect(filterShortcuts('json').map((item) => item.id)).toEqual(
      expect.arrayContaining(['export', 'import']),
    )
    expect(filterShortcuts('zzzz')).toEqual([])
  })
})

describe('resetScenarioContents', () => {
  it('clears forms and dependents but keeps the scenario identity', () => {
    const original = createEmptyScenario('Baseline', 'married_joint')
    original.forms.push(createFormInstance('W2'))
    original.dependents.push({
      id: 'dep-1',
      name: 'Kid',
      relationship: 'child',
      ageAtEndOf2025: 6,
      livedWithTaxpayerMoreThanHalfYear: true,
      providedMoreThanHalfOwnSupport: false,
      claimedAsDependent: true,
      citizenNationalOrResidentAlien: true,
      validEmploymentSSN: true,
    })
    original.estimatedPayments = 12_000

    const reset = resetScenarioContents(original)
    expect(reset.id).toBe(original.id)
    expect(reset.name).toBe('Baseline')
    expect(reset.createdAt).toBe(original.createdAt)
    expect(reset.forms).toEqual([])
    expect(reset.dependents).toEqual([])
    expect(reset.estimatedPayments).toBe(0)
    expect(reset.basics.filingStatus).toBe('married_joint')
  })
})
