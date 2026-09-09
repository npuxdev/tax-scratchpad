import { useEffect, useRef, useState } from 'react'
import { Input, Select } from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'

export function ScenarioSwitcher() {
  const { scenarios, activeScenario, activeScenarioId, switchScenario, dispatch } =
    useAppStore()
  const { namingScenarioId, endRenaming } = useUiState()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isNaming =
    namingScenarioId !== null && namingScenarioId === activeScenarioId

  useEffect(() => {
    if (isNaming && activeScenario) {
      setDraft(activeScenario.name)
      // Focus + select on next tick once the input is mounted.
      // Double rAF so focus wins if Duplicate (or another control) still
      // holds pointer-focus from the triggering click.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        })
      })
    }
  }, [isNaming, activeScenario])

  if (!activeScenario) return null

  const commit = () => {
    const next = draft.trim()
    if (next && next !== activeScenario.name) {
      dispatch({ type: 'SET_NAME', name: next })
    }
    endRenaming()
  }

  if (isNaming) {
    return (
      <Input
        ref={inputRef}
        plain
        className="scenario-switcher-name grow"
        aria-label="Scenario name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') endRenaming()
        }}
      />
    )
  }

  return (
    <div className="scenario-switcher-name grow">
      <Select
        aria-label="Active scenario"
        options={scenarios.map((s) => ({ value: s.id, label: s.name }))}
        value={activeScenarioId ?? undefined}
        onValueChange={(id) => void switchScenario(id)}
      />
    </div>
  )
}
