import { Button, DropdownMenu } from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { useAppActions } from '../app/AppActions'
import { getShortcut, shortcutCaption, type ShortcutId } from '../app/hotkeys'
import { HotkeyKeys } from './HotkeyKeys'

function MenuRow({
  id,
  label,
}: {
  id: ShortcutId
  label?: string
}) {
  return (
    <span className="menu-item-row">
      <span>{label ?? getShortcut(id).label}</span>
      <HotkeyKeys id={id} />
    </span>
  )
}

export function HeaderActions() {
  const { activeScenario, activeScenarioId } = useAppStore()
  const { beginRenaming } = useUiState()
  const {
    duplicate,
    compare,
    exportJson,
    importJson,
    requestDelete,
    requestReset,
    openShortcuts,
  } = useAppActions()

  if (!activeScenario || !activeScenarioId) return null

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        title={shortcutCaption('duplicate')}
        aria-keyshortcuts="D"
        onClick={duplicate}
      >
        Duplicate
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={shortcutCaption('compare')}
        aria-keyshortcuts="C"
        onClick={compare}
      >
        Compare
      </Button>
      <DropdownMenu
        label="More actions"
        items={[
          { label: 'Rename', onSelect: () => beginRenaming(activeScenarioId) },
          {
            label: <MenuRow id="export" label="Export JSON" />,
            searchText: 'Export JSON',
            onSelect: exportJson,
          },
          {
            label: <MenuRow id="import" label="Import JSON…" />,
            searchText: 'Import JSON',
            onSelect: importJson,
          },
          { separator: true },
          {
            label: <MenuRow id="reset" label="Reset all…" />,
            searchText: 'Reset all',
            onSelect: requestReset,
          },
          {
            label: <MenuRow id="delete" label="Delete scenario" />,
            searchText: 'Delete scenario',
            onSelect: requestDelete,
          },
        ]}
      />
      <Button
        variant="ghost"
        size="sm"
        className="shortcuts-trigger"
        aria-label="Keyboard shortcuts"
        aria-keyshortcuts="Shift+/ Meta+/"
        title={shortcutCaption('shortcuts')}
        onClick={openShortcuts}
      >
        ?
      </Button>
    </>
  )
}
