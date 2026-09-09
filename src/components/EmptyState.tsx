import { useState } from 'react'
import { Button, Empty } from '@noorddev/vlak-react'
import { CreateScenarioDialog } from './CreateScenarioDialog'
import { DISCLAIMER, STORAGE_NOTE } from '../app/labels'
import { useAppActions } from '../app/AppActions'
import { HotkeyKeys } from './HotkeyKeys'

export function EmptyState() {
  const [open, setOpen] = useState(false)
  const { importJson, openShortcuts } = useAppActions()

  return (
    <div className="empty-wrap">
      <div className="empty-inner">
        <Empty
          title="2025 Federal scratchpad"
          action={
            <div className="empty-actions">
              <Button variant="primary" onClick={() => setOpen(true)}>
                Start scenario
              </Button>
              <Button variant="ghost" onClick={importJson}>
                Import JSON
              </Button>
            </div>
          }
        >
          Change a tax assumption and see exactly what changes.
        </Empty>
        <p className="disclaimer" style={{ marginTop: 24 }}>
          Build a hypothetical federal tax scenario. Nothing leaves this browser.{' '}
          {DISCLAIMER} <strong>{STORAGE_NOTE}</strong>
        </p>
        <button
          type="button"
          className="shortcuts-inline"
          onClick={openShortcuts}
        >
          Press <HotkeyKeys id="shortcuts" /> for keyboard shortcuts,{' '}
          <HotkeyKeys id="import" /> to import
        </button>
      </div>
      <CreateScenarioDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
