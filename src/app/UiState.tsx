import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** Target of an open calculation trace. */
export interface TraceTarget {
  nodeId: string
}

interface UiStateValue {
  /** Scenario whose name is being edited inline in the switcher. */
  namingScenarioId: string | null
  beginRenaming: (id: string) => void
  endRenaming: () => void
  /** Set when a duplicate is pending, so the next active scenario is renamed. */
  pendingRename: boolean
  requestRenameOnNextActive: () => void
  clearPendingRename: () => void

  addFormOpen: boolean
  setAddFormOpen: (open: boolean) => void

  packetDrawerOpen: boolean
  setPacketDrawerOpen: (open: boolean) => void

  coverageDrawerOpen: boolean
  setCoverageDrawerOpen: (open: boolean) => void

  commandOpen: boolean
  setCommandOpen: (open: boolean) => void

  compareOpen: boolean
  setCompareOpen: (open: boolean) => void

  traceTarget: TraceTarget | null
  openTrace: (nodeId: string) => void
  closeTrace: () => void
}

const UiStateContext = createContext<UiStateValue | null>(null)

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [namingScenarioId, setNamingScenarioId] = useState<string | null>(null)
  const [pendingRename, setPendingRename] = useState(false)
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [packetDrawerOpen, setPacketDrawerOpen] = useState(false)
  const [coverageDrawerOpen, setCoverageDrawerOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [traceTarget, setTraceTarget] = useState<TraceTarget | null>(null)

  const beginRenaming = useCallback((id: string) => setNamingScenarioId(id), [])
  const endRenaming = useCallback(() => setNamingScenarioId(null), [])
  const requestRenameOnNextActive = useCallback(
    () => setPendingRename(true),
    [],
  )
  const clearPendingRename = useCallback(() => setPendingRename(false), [])
  const openTrace = useCallback(
    (nodeId: string) => setTraceTarget({ nodeId }),
    [],
  )
  const closeTrace = useCallback(() => setTraceTarget(null), [])

  const value = useMemo<UiStateValue>(
    () => ({
      namingScenarioId,
      beginRenaming,
      endRenaming,
      pendingRename,
      requestRenameOnNextActive,
      clearPendingRename,
      addFormOpen,
      setAddFormOpen,
      packetDrawerOpen,
      setPacketDrawerOpen,
      coverageDrawerOpen,
      setCoverageDrawerOpen,
      commandOpen,
      setCommandOpen,
      compareOpen,
      setCompareOpen,
      traceTarget,
      openTrace,
      closeTrace,
    }),
    [
      namingScenarioId,
      beginRenaming,
      endRenaming,
      pendingRename,
      requestRenameOnNextActive,
      clearPendingRename,
      addFormOpen,
      packetDrawerOpen,
      coverageDrawerOpen,
      commandOpen,
      compareOpen,
      traceTarget,
      openTrace,
      closeTrace,
    ],
  )

  return <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>
}

export function useUiState(): UiStateValue {
  const ctx = useContext(UiStateContext)
  if (!ctx) throw new Error('useUiState must be used within UiStateProvider')
  return ctx
}
