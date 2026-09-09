import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Empty } from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { BASICS_SELECTION } from '../app/packet'
import { BasicsEditor } from './BasicsEditor'
import { ScratchpadSection } from './ScratchpadSection'
import { buildScratchpadModel } from './scratchpadModel'
import { parseFieldValue, toEditableString } from '../forms/fieldEditing'
import type { ScratchRow } from './ScratchpadRow'

export function ScratchpadView() {
  const {
    activeScenario,
    calculation,
    selectedFormId,
    selectedFieldId,
    setSelectedFieldId,
    dispatch,
  } = useAppStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const rowRefs = useRef<Array<HTMLDivElement | null>>([])

  const model = useMemo(
    () =>
      activeScenario
        ? buildScratchpadModel(activeScenario, calculation, selectedFormId)
        : { sections: [], flat: [], readOnly: false },
    [activeScenario, calculation, selectedFormId],
  )

  const flat = model.flat

  // Reset traversal when the selected form changes — unless a field target is pending.
  useEffect(() => {
    if (selectedFieldId) return
    setSelectedIndex(0)
    setEditing(false)
    setEditError(null)
  }, [selectedFormId, selectedFieldId])

  // Honor command-palette / duplicate field selection.
  useEffect(() => {
    if (!selectedFieldId) return
    const index = flat.findIndex((row) => row.fieldId === selectedFieldId)
    if (index < 0) return
    setSelectedIndex(index)
    setEditError(null)
    const row = flat[index]
    requestAnimationFrame(() => {
      const el = rowRefs.current[index]
      el?.focus()
      el?.scrollIntoView({ block: 'nearest' })
      if (row?.editable && row.dataType !== 'boolean') {
        setEditValue(toEditableString(row.value, row.dataType))
        setEditing(true)
      } else {
        setEditing(false)
      }
    })
    // Intentionally omit `flat` — value updates must not re-trigger edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFieldId, selectedFormId])

  const registerRef = useCallback((index: number, el: HTMLDivElement | null) => {
    rowRefs.current[index] = el
  }, [])

  const focusRow = useCallback((index: number) => {
    requestAnimationFrame(() => {
      const el = rowRefs.current[index]
      el?.focus()
      el?.scrollIntoView({ block: 'nearest' })
    })
  }, [])

  const startEdit = useCallback(
    (index: number) => {
      const row = flat[index]
      if (!row || !row.editable) return
      // Booleans toggle in place rather than opening a text editor.
      if (row.dataType === 'boolean') {
        dispatch({
          type: 'SET_FORM_VALUE',
          formId: row.formId,
          fieldId: row.fieldId,
          value: !row.value,
        })
        return
      }
      setSelectedIndex(index)
      setSelectedFieldId(row.fieldId)
      setEditValue(toEditableString(row.value, row.dataType))
      setEditError(null)
      setEditing(true)
    },
    [dispatch, flat, setSelectedFieldId],
  )

  const commit = useCallback(
    (row: ScratchRow): boolean => {
      const result = parseFieldValue(editValue, row.dataType)
      if (!result.ok) {
        setEditError(result.error ?? 'Invalid value')
        return false
      }
      dispatch({
        type: 'SET_FORM_VALUE',
        formId: row.formId,
        fieldId: row.fieldId,
        value: result.value ?? null,
      })
      return true
    },
    [dispatch, editValue],
  )

  const stopEditing = useCallback(() => {
    setEditing(false)
    setEditError(null)
  }, [])

  const move = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        const next = Math.max(0, Math.min(flat.length - 1, prev + delta))
        focusRow(next)
        return next
      })
    },
    [flat.length, focusRow],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (flat.length === 0) return
      const row = flat[selectedIndex]

      if (editing) {
        if (e.key === 'Escape') {
          e.preventDefault()
          stopEditing()
          focusRow(selectedIndex)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (row && commit(row)) {
            stopEditing()
            focusRow(selectedIndex)
          }
        } else if (e.key === 'Tab') {
          e.preventDefault()
          const delta = e.shiftKey ? -1 : 1
          if (row && commit(row)) {
            stopEditing()
            const next = Math.max(0, Math.min(flat.length - 1, selectedIndex + delta))
            setSelectedIndex(next)
            const nextRow = flat[next]
            if (nextRow && nextRow.editable && nextRow.dataType !== 'boolean') {
              setEditValue(toEditableString(nextRow.value, nextRow.dataType))
              setEditError(null)
              setEditing(true)
            } else {
              focusRow(next)
            }
          }
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          move(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          move(-1)
          break
        case 'Enter':
          e.preventDefault()
          startEdit(selectedIndex)
          break
        default:
          break
      }
    },
    [commit, editing, flat, focusRow, move, selectedIndex, startEdit, stopEditing],
  )

  if (!activeScenario) return null

  if (selectedFormId === BASICS_SELECTION) {
    return <BasicsEditor />
  }

  if (flat.length === 0 && model.sections.length <= 1) {
    const section = model.sections[0]
    return (
      <div className="scratchpad">
        <Empty title={section?.title ?? 'Nothing here yet'}>
          {section?.meta ?? 'Add a form to start entering values.'}
        </Empty>
      </div>
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="scratchpad"
      role="listbox"
      aria-label="Scratchpad fields"
      onKeyDown={onKeyDown}
    >
      {model.sections.map((section) => (
        <ScratchpadSection
          key={section.key}
          section={section}
          selectedIndex={selectedIndex}
          editing={editing}
          editValue={editValue}
          editError={editError}
          registerRef={registerRef}
          onSelect={(i) => {
            setSelectedIndex(i)
            const row = flat[i]
            if (row) setSelectedFieldId(row.fieldId)
            focusRow(i)
          }}
          onStartEdit={startEdit}
          onEditChange={setEditValue}
        />
      ))}
    </div>
  )
}
