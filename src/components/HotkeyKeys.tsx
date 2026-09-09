import { Kbd, KbdPair } from '@noorddev/vlak-react'
import {
  formatCombo,
  isApplePlatform,
  type KeyCombo,
  type Shortcut,
  type ShortcutId,
  getShortcut,
} from '../app/hotkeys'

interface HotkeyKeysProps {
  shortcut?: Shortcut
  id?: ShortcutId
  sequence?: KeyCombo[]
  apple?: boolean
  className?: string
}

export function HotkeyKeys({
  shortcut,
  id,
  sequence,
  apple = isApplePlatform(),
  className,
}: HotkeyKeysProps) {
  const resolved = shortcut ?? (id ? getShortcut(id) : undefined)
  const combos = sequence ?? resolved?.sequence
  if (!combos || combos.length === 0) return null

  return (
    <span className={className ? `hotkey-keys ${className}` : 'hotkey-keys'}>
      {combos.map((combo, index) => (
        <span key={`${combo.key}-${index}`} className="hotkey-keys__chord">
          {index > 0 ? <span className="hotkey-keys__then">then</span> : null}
          <ComboPills combo={combo} apple={apple} />
        </span>
      ))}
    </span>
  )
}

function ComboPills({ combo, apple }: { combo: KeyCombo; apple: boolean }) {
  const parts = formatCombo(combo, apple)
  if (parts.length === 1) {
    return <Kbd>{parts[0]}</Kbd>
  }
  return (
    <KbdPair>
      {parts.map((part) => (
        <Kbd key={part}>{part}</Kbd>
      ))}
    </KbdPair>
  )
}
