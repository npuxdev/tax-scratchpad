import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogBody,
  DialogTitle,
  Input,
} from '@noorddev/vlak-react'
import {
  SHORTCUT_GROUPS,
  filterShortcuts,
  isApplePlatform,
  type Shortcut,
} from '../app/hotkeys'
import { HotkeyKeys } from './HotkeyKeys'

interface ShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [])

  const grouped = useMemo(() => {
    const matches = filterShortcuts(query)
    return SHORTCUT_GROUPS.map((group) => ({
      ...group,
      items: matches.filter((item) => item.group === group.id),
    })).filter((group) => group.items.length > 0)
  }, [query])

  return (
    <Dialog
      className="app-dialog app-dialog--shortcuts"
      open={open}
      onClose={onClose}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DialogTitle>Keyboard shortcuts</DialogTitle>
      <DialogBody>
        <div className="shortcuts">
          <p className="shortcuts__lede">
            Letter keys work when you are not typing in a field.{' '}
            {isApplePlatform() ? '⌘K' : 'Ctrl+K'} opens the command palette.
          </p>
          <Input
            ref={searchRef}
            plain
            autoFocus
            className="shortcuts__search"
            aria-label="Search shortcuts"
            placeholder="Search shortcuts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {grouped.length === 0 ? (
            <p className="shortcuts__empty">No shortcuts match “{query}”.</p>
          ) : (
            <div className="shortcuts__grid">
              {grouped.map((group) => (
                <section key={group.id} className="shortcuts__group">
                  <h3 className="shortcuts__heading">{group.label}</h3>
                  <ul className="shortcuts__list">
                    {group.items.map((item) => (
                      <ShortcutRow key={item.id} shortcut={item} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          <p className="shortcuts__foot">
            <HotkeyKeys id="shortcuts-alt" /> also opens this guide while
            typing. Esc closes.
          </p>
        </div>
      </DialogBody>
    </Dialog>
  )
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <li className="shortcuts__row">
      <div className="shortcuts__copy">
        <span className="shortcuts__label">{shortcut.label}</span>
        <span className="shortcuts__desc">{shortcut.description}</span>
      </div>
      <HotkeyKeys shortcut={shortcut} />
    </li>
  )
}
