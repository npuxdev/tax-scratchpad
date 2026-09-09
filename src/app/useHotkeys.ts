import { useEffect, useRef, useState } from 'react'
import {
  CHORD_TIMEOUT_MS,
  eventToCombo,
  hasOpenDialog,
  isTypingTarget,
  matchShortcuts,
  type KeyCombo,
  type Shortcut,
  type ShortcutId,
} from './hotkeys'

export type HotkeyHandlers = Partial<Record<ShortcutId, () => void>>

interface UseHotkeysOptions {
  enabled?: boolean
  handlers: HotkeyHandlers
}

export interface ChordState {
  prefix: KeyCombo[]
  pending: Shortcut[]
}

/**
 * Global capture-phase listener. Capture lets us stop a letter from
 * also triggering type-ahead in a closed select, while still refusing
 * to steal keys from a focused text field.
 */
export function useHotkeys({ enabled = true, handlers }: UseHotkeysOptions): ChordState {
  const handlersRef = useRef(handlers)
  const prefixRef = useRef<KeyCombo[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [chord, setChord] = useState<ChordState>({ prefix: [], pending: [] })

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!enabled) return

    const clearChord = () => {
      prefixRef.current = []
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setChord({ prefix: [], pending: [] })
    }

    const armTimeout = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.repeat) return
      if (event.defaultPrevented) return

      const typing = isTypingTarget(event.target)
      const dialogOpen = hasOpenDialog()

      const allow = (shortcut: Shortcut) =>
        (!typing || Boolean(shortcut.allowInInput)) &&
        (!dialogOpen || Boolean(shortcut.allowInDialog))

      const continued = matchShortcuts(event, prefixRef.current)
      let hit = continued.hit && allow(continued.hit) ? continued.hit : null
      let pending = continued.pending.filter(allow)
      let basePrefix = prefixRef.current

      // A pending G-prefix shouldn't swallow a different complete shortcut
      // (⌘K, T, ?). Fall back to a fresh match when the chord doesn't continue.
      if (!hit && pending.length === 0 && prefixRef.current.length > 0) {
        const fresh = matchShortcuts(event, [])
        hit = fresh.hit && allow(fresh.hit) ? fresh.hit : null
        pending = fresh.pending.filter(allow)
        if (hit || pending.length > 0) {
          basePrefix = []
        }
      }

      if (hit) {
        event.preventDefault()
        event.stopPropagation()
        clearChord()
        handlersRef.current[hit.id]?.()
        return
      }

      if (pending.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        const nextPrefix = [...basePrefix, eventToCombo(event)]
        prefixRef.current = nextPrefix
        setChord({ prefix: nextPrefix, pending })
        armTimeout()
        return
      }

      if (prefixRef.current.length > 0) {
        clearChord()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled])

  return chord
}
