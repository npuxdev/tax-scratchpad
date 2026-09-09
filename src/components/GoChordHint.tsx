import { HotkeyKeys } from './HotkeyKeys'
import type { ChordState } from '../app/useHotkeys'

interface GoChordHintProps {
  chord: ChordState
}

/** Instant hint while a G-prefix is pending — no motion, keyboard-speed. */
export function GoChordHint({ chord }: GoChordHintProps) {
  if (chord.pending.length === 0) return null

  const isGo = chord.pending.every((item) => item.group === 'go')

  return (
    <div className="chord-hint" role="status">
      <p className="chord-hint__title">{isGo ? 'Go to' : 'Then'}</p>
      <ul className="chord-hint__list">
        {chord.pending.map((item) => {
          const next = item.sequence[chord.prefix.length]
          if (!next) return null
          return (
            <li key={item.id} className="chord-hint__row">
              <HotkeyKeys sequence={[next]} />
              <span>{item.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
