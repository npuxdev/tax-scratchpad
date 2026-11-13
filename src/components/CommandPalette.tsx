import { useMemo } from 'react'
import { CommandDialog, type CommandGroup } from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { useAppActions } from '../app/AppActions'
import { buildPacket } from '../app/packet'
import { getFormDefinition } from '../forms/definitions'
import { HotkeyKeys } from './HotkeyKeys'
import type { ShortcutId } from '../app/hotkeys'

function Hint({ id }: { id: ShortcutId }) {
  return <HotkeyKeys id={id} />
}

export function CommandPalette() {
  const {
    activeScenario,
    calculation,
    mainView,
    setSelectedFormId,
    setMainView,
    selectFormField,
  } = useAppStore()
  const { commandOpen, setCommandOpen } = useUiState()
  const {
    addForm,
    toggleView,
    goScratchpad,
    goForm,
    goBasics,
    duplicate,
    compare,
    exportJson,
    importJson,
    requestDelete,
    requestReset,
    loadDemo,
    openShortcuts,
    toggleTheme,
  } = useAppActions()

  const groups = useMemo<CommandGroup[]>(() => {
    if (!activeScenario) return []
    const packet = buildPacket(activeScenario, calculation)

    const jumpTo = (id: string, view: 'form' | 'scratchpad') => {
      setSelectedFormId(id)
      setMainView(view)
      setCommandOpen(false)
    }

    const jumpToField = (formId: string, fieldId: string) => {
      selectFormField(formId, fieldId)
      // Stay on the current working plane so Scratchpad↔Form context is preserved.
      if (mainView !== 'scratchpad' && mainView !== 'form') {
        setMainView('scratchpad')
      }
      setCommandOpen(false)
    }

    const run = (action: () => void) => {
      setCommandOpen(false)
      action()
    }

    const formsGroup: CommandGroup = {
      label: 'Forms',
      items: [...packet.inputs, ...packet.calculated].map((item) => ({
        label: item.sublabel ? `${item.label} · ${item.sublabel}` : item.label,
        keywords: `${item.label} ${item.sublabel ?? ''}`,
        onSelect: () =>
          jumpTo(item.id, item.kind === 'basics' ? 'scratchpad' : 'form'),
      })),
    }

    const fieldItems = activeScenario.forms.flatMap((form) => {
      const def = getFormDefinition(form.type)
      return def.fields.map((field) => ({
        label: `${form.label}: ${field.label}`,
        keywords: `${form.label} ${field.label} ${field.box ?? ''}`,
        hint: field.box ? `Box ${field.box}` : undefined,
        onSelect: () => jumpToField(form.id, field.id),
      }))
    })

    const fieldsGroup: CommandGroup = { label: 'Fields', items: fieldItems }

    const actionsGroup: CommandGroup = {
      label: 'Actions',
      items: [
        {
          label: 'Add form…',
          keywords: 'new create n',
          hint: <Hint id="add-form" />,
          onSelect: () => run(addForm),
        },
        {
          label: 'Toggle Scratchpad / Form',
          keywords: 'view switch t',
          hint: <Hint id="toggle-view" />,
          onSelect: () => run(toggleView),
        },
        {
          label: 'Go to Scratchpad',
          keywords: 'g s',
          hint: <Hint id="go-scratchpad" />,
          onSelect: () => run(goScratchpad),
        },
        {
          label: 'Go to Form',
          keywords: 'g f',
          hint: <Hint id="go-form" />,
          onSelect: () => run(goForm),
        },
        {
          label: 'Go to Basics',
          keywords: 'g b filing status dependents',
          hint: <Hint id="go-basics" />,
          onSelect: () => run(goBasics),
        },
        {
          label: 'Duplicate scenario',
          keywords: 'copy d',
          hint: <Hint id="duplicate" />,
          onSelect: () => run(duplicate),
        },
        {
          label: 'Compare scenarios…',
          keywords: 'diff side by side c',
          hint: <Hint id="compare" />,
          onSelect: () => run(compare),
        },
        {
          label: 'Export JSON',
          keywords: 'download e',
          hint: <Hint id="export" />,
          onSelect: () => run(exportJson),
        },
        {
          label: 'Import JSON…',
          keywords: 'upload i',
          hint: <Hint id="import" />,
          onSelect: () => run(importJson),
        },
        {
          label: 'Reset demo',
          keywords: 'baseline demonstration fixture',
          onSelect: () => run(loadDemo),
        },
        {
          label: 'Reset all…',
          keywords: 'clear wipe',
          hint: <Hint id="reset" />,
          onSelect: () => run(requestReset),
        },
        {
          label: 'Delete scenario…',
          keywords: 'remove',
          hint: <Hint id="delete" />,
          onSelect: () => run(requestDelete),
        },
        {
          label: 'Toggle appearance',
          keywords: 'dark light theme appearance mode',
          hint: <Hint id="toggle-theme" />,
          onSelect: () => run(toggleTheme),
        },
        {
          label: 'Keyboard shortcuts',
          keywords: 'help ?',
          hint: <Hint id="shortcuts" />,
          onSelect: () => run(openShortcuts),
        },
      ],
    }

    return [actionsGroup, formsGroup, fieldsGroup]
  }, [
    activeScenario,
    addForm,
    calculation,
    compare,
    duplicate,
    exportJson,
    goBasics,
    goForm,
    goScratchpad,
    importJson,
    loadDemo,
    mainView,
    openShortcuts,
    requestDelete,
    requestReset,
    selectFormField,
    setCommandOpen,
    setMainView,
    setSelectedFormId,
    toggleTheme,
    toggleView,
  ])

  return (
    <CommandDialog
      className="app-dialog"
      open={commandOpen}
      onClose={() => setCommandOpen(false)}
      groups={groups}
      placeholder="Jump to a form, field, or action…"
      emptyLabel="No matches"
    />
  )
}
