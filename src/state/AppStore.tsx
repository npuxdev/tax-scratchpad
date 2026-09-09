import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { calculateFederal2025 } from '../tax/2025/calculate'
import type {
  Federal2025Result,
  FilingStatus,
  Preferences,
  TaxScenario,
} from '../tax/types'
import {
  createEmptyScenario,
  duplicateScenario as duplicateScenarioModel,
  resetScenarioContents,
} from './scenario'
import { scenarioReducer, type ScenarioAction } from './reducer'
import {
  deleteScenario as dbDeleteScenario,
  getAllScenarios,
  getPreferences,
  putScenario,
  setPreferences,
} from '../storage/db'
import { exportScenarioJson } from '../storage/export'
import { importScenarioJson } from '../storage/import'

export type MainView = 'scratchpad' | 'form'

const PERSIST_DEBOUNCE_MS = 300

interface AppStoreValue {
  ready: boolean
  scenarios: TaxScenario[]
  activeScenarioId: string | null
  activeScenario: TaxScenario | null
  calculation: Federal2025Result | null
  selectedFormId: string | null
  setSelectedFormId: (id: string | null) => void
  mainView: MainView
  setMainView: (view: MainView) => void
  dispatch: (action: ScenarioAction) => void
  createScenario: (name: string, filingStatus: FilingStatus) => Promise<void>
  deleteScenario: (id: string) => Promise<void>
  duplicateScenario: (id?: string) => Promise<void>
  switchScenario: (id: string) => Promise<void>
  importScenario: (json: string, regenerateIds?: boolean) => Promise<void>
  exportActiveScenario: () => string | null
  resetActiveScenario: () => Promise<void>
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function useDebouncedPersist() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((scenario: TaxScenario) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void putScenario(scenario)
    }, PERSIST_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return persist
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [scenarios, setScenarios] = useState<TaxScenario[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [mainView, setMainView] = useState<MainView>('scratchpad')
  const persist = useDebouncedPersist()

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  const calculation = useMemo(
    () => (activeScenario ? calculateFederal2025(activeScenario) : null),
    [activeScenario],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [loaded, prefs] = await Promise.all([
        getAllScenarios(),
        getPreferences(),
      ])
      if (cancelled) return
      setScenarios(loaded)
      const preferred =
        prefs.lastScenarioId &&
        loaded.some((s) => s.id === prefs.lastScenarioId)
          ? prefs.lastScenarioId
          : (loaded[0]?.id ?? null)
      setActiveScenarioId(preferred)
      setReady(true)
    })().catch((err: unknown) => {
      console.error('Failed to load scenarios', err)
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const rememberActive = useCallback(async (id: string | null) => {
    const prefs: Preferences = { lastScenarioId: id ?? undefined }
    await setPreferences(prefs)
  }, [])

  const updateScenarioInList = useCallback(
    (next: TaxScenario) => {
      setScenarios((prev) => {
        const exists = prev.some((s) => s.id === next.id)
        const list = exists
          ? prev.map((s) => (s.id === next.id ? next : s))
          : [next, ...prev]
        return list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
      })
      persist(next)
    },
    [persist],
  )

  const dispatch = useCallback(
    (action: ScenarioAction) => {
      if (!activeScenario) return
      const next = scenarioReducer(activeScenario, action)
      updateScenarioInList(next)
    },
    [activeScenario, updateScenarioInList],
  )

  const createScenario = useCallback(
    async (name: string, filingStatus: FilingStatus) => {
      const scenario = createEmptyScenario(name, filingStatus)
      await putScenario(scenario)
      setScenarios((prev) => [scenario, ...prev])
      setActiveScenarioId(scenario.id)
      setSelectedFormId(null)
      setMainView('scratchpad')
      await rememberActive(scenario.id)
    },
    [rememberActive],
  )

  const deleteScenarioFn = useCallback(
    async (id: string) => {
      await dbDeleteScenario(id)
      setScenarios((prev) => {
        const next = prev.filter((s) => s.id !== id)
        if (activeScenarioId === id) {
          const fallback = next[0]?.id ?? null
          setActiveScenarioId(fallback)
          void rememberActive(fallback)
          setSelectedFormId(null)
        }
        return next
      })
    },
    [activeScenarioId, rememberActive],
  )

  const duplicateScenarioFn = useCallback(
    async (id?: string) => {
      const sourceId = id ?? activeScenarioId
      const source = scenarios.find((s) => s.id === sourceId)
      if (!source) return
      const copy = duplicateScenarioModel(source)
      await putScenario(copy)
      setScenarios((prev) => [copy, ...prev])
      setActiveScenarioId(copy.id)
      setSelectedFormId(null)
      await rememberActive(copy.id)
    },
    [activeScenarioId, rememberActive, scenarios],
  )

  const switchScenario = useCallback(
    async (id: string) => {
      if (!scenarios.some((s) => s.id === id)) return
      setActiveScenarioId(id)
      setSelectedFormId(null)
      setMainView('scratchpad')
      await rememberActive(id)
    },
    [rememberActive, scenarios],
  )

  const importScenario = useCallback(
    async (json: string, regenerateIds = true) => {
      const scenario = importScenarioJson(json, { regenerateIds })
      await putScenario(scenario)
      setScenarios((prev) => [scenario, ...prev])
      setActiveScenarioId(scenario.id)
      setSelectedFormId(null)
      await rememberActive(scenario.id)
    },
    [rememberActive],
  )

  const exportActiveScenario = useCallback(() => {
    if (!activeScenario) return null
    return exportScenarioJson(activeScenario)
  }, [activeScenario])

  const resetActiveScenario = useCallback(async () => {
    if (!activeScenario) return
    const next = resetScenarioContents(activeScenario)
    updateScenarioInList(next)
    setSelectedFormId(null)
    setMainView('scratchpad')
    await putScenario(next)
  }, [activeScenario, updateScenarioInList])

  const value = useMemo<AppStoreValue>(
    () => ({
      ready,
      scenarios,
      activeScenarioId,
      activeScenario,
      calculation,
      selectedFormId,
      setSelectedFormId,
      mainView,
      setMainView,
      dispatch,
      createScenario,
      deleteScenario: deleteScenarioFn,
      duplicateScenario: duplicateScenarioFn,
      switchScenario,
      importScenario,
      exportActiveScenario,
      resetActiveScenario,
    }),
    [
      ready,
      scenarios,
      activeScenarioId,
      activeScenario,
      calculation,
      selectedFormId,
      mainView,
      dispatch,
      createScenario,
      deleteScenarioFn,
      duplicateScenarioFn,
      switchScenario,
      importScenario,
      exportActiveScenario,
      resetActiveScenario,
    ],
  )

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  )
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) {
    throw new Error('useAppStore must be used within AppStoreProvider')
  }
  return ctx
}
