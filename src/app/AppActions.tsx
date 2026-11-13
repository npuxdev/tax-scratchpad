import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
  toast,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from './UiState'
import { useHotkeys, type ChordState } from './useHotkeys'
import { useTheme } from './useTheme'
import { BASICS_SELECTION } from './packet'
import { downloadJsonFile, readImportedFile, scenarioDownloadName } from './scenarioIo'
import { shortcutCaption } from './hotkeys'
import { ShortcutsHelp } from '../components/ShortcutsHelp'
import { GoChordHint } from '../components/GoChordHint'

interface AppActionsValue {
  addForm: () => void
  toggleView: () => void
  goScratchpad: () => void
  goForm: () => void
  goBasics: () => void
  duplicate: () => void
  compare: () => void
  exportJson: () => void
  importJson: () => void
  requestDelete: () => void
  requestReset: () => void
  loadDemo: () => void
  toggleCommand: () => void
  toggleShortcuts: () => void
  openShortcuts: () => void
  toggleTheme: () => void
  shortcutTitle: typeof shortcutCaption
}

const AppActionsContext = createContext<AppActionsValue | null>(null)

export function AppActionsProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    activeScenario,
    activeScenarioId,
    mainView,
    setMainView,
    setSelectedFormId,
    duplicateScenario,
    deleteScenario,
    exportActiveScenario,
    importScenario,
    resetActiveScenario,
    loadDemoScenario,
  } = useAppStore()
  const {
    setAddFormOpen,
    setCommandOpen,
    commandOpen,
    setCompareOpen,
    requestRenameOnNextActive,
  } = useUiState()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { toggleTheme } = useTheme()

  const addForm = useCallback(() => {
    if (!activeScenario) return
    setAddFormOpen(true)
  }, [activeScenario, setAddFormOpen])

  const toggleView = useCallback(() => {
    if (!activeScenario) return
    setMainView(mainView === 'scratchpad' ? 'form' : 'scratchpad')
  }, [activeScenario, mainView, setMainView])

  const goScratchpad = useCallback(() => {
    if (!activeScenario) return
    setMainView('scratchpad')
  }, [activeScenario, setMainView])

  const goForm = useCallback(() => {
    if (!activeScenario) return
    setMainView('form')
  }, [activeScenario, setMainView])

  const goBasics = useCallback(() => {
    if (!activeScenario) return
    setSelectedFormId(BASICS_SELECTION)
    setMainView('scratchpad')
  }, [activeScenario, setMainView, setSelectedFormId])

  const duplicate = useCallback(() => {
    if (!activeScenario) return
    requestRenameOnNextActive()
    void duplicateScenario()
  }, [activeScenario, duplicateScenario, requestRenameOnNextActive])

  const compare = useCallback(() => {
    if (!activeScenario) return
    setCompareOpen(true)
  }, [activeScenario, setCompareOpen])

  const exportJson = useCallback(() => {
    if (!activeScenario) return
    const json = exportActiveScenario()
    if (!json) return
    downloadJsonFile(scenarioDownloadName(activeScenario.name), json)
    toast('Exported scenario JSON')
  }, [activeScenario, exportActiveScenario])

  const importJson = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const requestDelete = useCallback(() => {
    if (!activeScenario) return
    setConfirmDelete(true)
  }, [activeScenario])

  const requestReset = useCallback(() => {
    if (!activeScenario) return
    setConfirmReset(true)
  }, [activeScenario])

  const loadDemo = useCallback(() => {
    void loadDemoScenario()
    toast('Loaded demonstration scenario')
  }, [loadDemoScenario])

  const toggleCommand = useCallback(() => {
    if (!activeScenario) return
    setCommandOpen(!commandOpen)
  }, [activeScenario, commandOpen, setCommandOpen])

  const toggleShortcuts = useCallback(() => {
    setShortcutsOpen((open) => !open)
  }, [])

  const openShortcuts = useCallback(() => setShortcutsOpen(true), [])

  const confirmDeleteNow = useCallback(() => {
    if (!activeScenarioId) return
    void deleteScenario(activeScenarioId)
    setConfirmDelete(false)
    toast('Scenario deleted')
  }, [activeScenarioId, deleteScenario])

  const confirmResetNow = useCallback(() => {
    void resetActiveScenario()
    setConfirmReset(false)
    toast('Scenario reset')
  }, [resetActiveScenario])

  const handleImportFile = useCallback(
    (file: File) => {
      void readImportedFile(file, importScenario)
    },
    [importScenario],
  )

  const chord: ChordState = useHotkeys({
    enabled: ready,
    handlers: {
      command: toggleCommand,
      shortcuts: toggleShortcuts,
      'shortcuts-alt': toggleShortcuts,
      'add-form': addForm,
      'toggle-view': toggleView,
      'go-scratchpad': goScratchpad,
      'go-form': goForm,
      'go-basics': goBasics,
      duplicate,
      compare,
      export: exportJson,
      import: importJson,
      delete: requestDelete,
      reset: requestReset,
      'toggle-theme': toggleTheme,
    },
  })

  const value = useMemo<AppActionsValue>(
    () => ({
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
      toggleCommand,
      toggleShortcuts,
      openShortcuts,
      toggleTheme,
      shortcutTitle: shortcutCaption,
    }),
    [
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
      toggleCommand,
      toggleShortcuts,
      openShortcuts,
      toggleTheme,
    ],
  )

  return (
    <AppActionsContext.Provider value={value}>
      {children}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportFile(file)
          e.target.value = ''
        }}
      />

      {shortcutsOpen ? (
        <ShortcutsHelp open onClose={() => setShortcutsOpen(false)} />
      ) : null}
      <GoChordHint chord={chord} />

      <Dialog
        className="app-dialog"
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        dismissable
        lightDismiss
        closeLabel="Close"
      >
        <DialogTitle>Delete this scenario?</DialogTitle>
        <DialogBody>
          {activeScenario
            ? `“${activeScenario.name}” will be removed from this browser. This cannot be undone.`
            : 'This scenario will be removed. This cannot be undone.'}
        </DialogBody>
        <DialogActions>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmDeleteNow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        className="app-dialog"
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        dismissable
        lightDismiss
        closeLabel="Close"
      >
        <DialogTitle>Reset all inputs?</DialogTitle>
        <DialogBody>
          {activeScenario
            ? `Every form, dependent, and basics field in “${activeScenario.name}” will return to defaults. The scenario itself stays. This cannot be undone.`
            : 'Every form and input will return to defaults. This cannot be undone.'}
        </DialogBody>
        <DialogActions>
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmResetNow}>
            Reset all
          </Button>
        </DialogActions>
      </Dialog>
    </AppActionsContext.Provider>
  )
}

export function useAppActions(): AppActionsValue {
  const ctx = useContext(AppActionsContext)
  if (!ctx) {
    throw new Error('useAppActions must be used within AppActionsProvider')
  }
  return ctx
}
