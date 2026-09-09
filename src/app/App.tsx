import { useEffect } from 'react'
import '@noorddev/vlak-react/css'
import '../styles/app.css'
import { Toaster } from '@noorddev/vlak-react'
import { AppStoreProvider, useAppStore } from '../state/AppStore'
import { UiStateProvider, useUiState } from './UiState'
import { AppActionsProvider } from './AppActions'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'

function AppInner() {
  const { ready, activeScenario, activeScenarioId } = useAppStore()
  const { pendingRename, clearPendingRename, beginRenaming } = useUiState()

  // After a duplicate (including from D), focus the new scenario name.
  useEffect(() => {
    if (pendingRename && activeScenarioId) {
      beginRenaming(activeScenarioId)
      clearPendingRename()
    }
  }, [pendingRename, activeScenarioId, beginRenaming, clearPendingRename])

  if (!ready) {
    return <div className="empty-wrap" aria-busy="true" />
  }

  return activeScenario ? <AppShell /> : <EmptyState />
}

export default function App() {
  return (
    <AppStoreProvider>
      <UiStateProvider>
        <AppActionsProvider>
          <AppInner />
          <Toaster closeLabel="Dismiss" />
        </AppActionsProvider>
      </UiStateProvider>
    </AppStoreProvider>
  )
}
