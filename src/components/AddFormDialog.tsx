import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { ADDABLE_FORM_TYPES, FORM_TYPE_LABELS } from '../app/labels'
import { createFormInstance } from '../state/scenario'
import type { TaxFormType } from '../tax/types'

const NEW_BUSINESS = '__new__'
const PAGE = 10

export function AddFormDialog() {
  const { activeScenario, dispatch, setSelectedFormId, setMainView } = useAppStore()
  const { addFormOpen, setAddFormOpen } = useUiState()
  const [type, setType] = useState<TaxFormType | ''>('')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [scheduleCChoice, setScheduleCChoice] = useState<string>(NEW_BUSINESS)
  const inputId = useId()
  const listId = useId()
  const optionId = (index: number) => `${listId}-opt-${index}`
  const activeRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!addFormOpen) return
    setType('')
    setQuery('')
    setActiveIndex(0)
    setScheduleCChoice(NEW_BUSINESS)
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [addFormOpen])

  const options = useMemo(
    () =>
      ADDABLE_FORM_TYPES.map((t) => ({
        value: t,
        label: FORM_TYPE_LABELS[t],
      })),
    [],
  )

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle
      ? options.filter((o) => o.label.toLowerCase().includes(needle))
      : options
  }, [options, query])

  useEffect(() => {
    setActiveIndex((i) => Math.max(0, Math.min(matches.length - 1, i)))
  }, [matches.length])

  useEffect(() => {
    if (addFormOpen) activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [addFormOpen, activeIndex])

  if (!activeScenario) return null

  const scheduleCForms = activeScenario.forms.filter(
    (f) => f.type === 'SCHEDULE_C',
  )

  const close = () => setAddFormOpen(false)

  const finish = (selectId: string) => {
    setSelectedFormId(selectId)
    setMainView('form')
    close()
  }

  const addSimple = (formType: TaxFormType) => {
    const form = createFormInstance(formType)
    dispatch({ type: 'ADD_FORM', form })
    finish(form.id)
  }

  const addNec = () => {
    if (scheduleCChoice === NEW_BUSINESS) {
      // Create the business and the linked 1099-NEC atomically.
      const scheduleC = createFormInstance('SCHEDULE_C')
      const nec = createFormInstance('1099_NEC', undefined, {
        scheduleCId: scheduleC.id,
      })
      dispatch({
        type: 'REPLACE_SCENARIO',
        scenario: {
          ...activeScenario,
          forms: [...activeScenario.forms, scheduleC, nec],
        },
      })
      finish(nec.id)
    } else {
      const nec = createFormInstance('1099_NEC', undefined, {
        scheduleCId: scheduleCChoice,
      })
      dispatch({ type: 'ADD_FORM', form: nec })
      finish(nec.id)
    }
  }

  const handleAdd = () => {
    if (!type) return
    if (type === '1099_NEC') {
      addNec()
    } else {
      addSimple(type)
    }
  }

  const pick = (formType: TaxFormType) => {
    setType(formType)
    setQuery('')
    const idx = options.findIndex((o) => o.value === formType)
    setActiveIndex(Math.max(0, idx))
    searchRef.current?.focus()
  }

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = Math.max(0, matches.length - 1)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(last, i + 1))
        return
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
        return
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        return
      case 'End':
        e.preventDefault()
        setActiveIndex(last)
        return
      case 'PageUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - PAGE))
        return
      case 'PageDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(last, i + PAGE))
        return
      case 'Enter': {
        const match = matches[activeIndex]
        if (!match) return
        e.preventDefault()
        if (type === match.value) handleAdd()
        else pick(match.value)
        return
      }
      default:
        return
    }
  }

  const scheduleCOptions = [
    ...scheduleCForms.map((f) => ({
      value: f.id,
      label:
        (typeof f.values.businessName === 'string' && f.values.businessName) ||
        f.label,
    })),
    { value: NEW_BUSINESS, label: 'Create new business' },
  ]

  const hasList = matches.length > 0
  const activeOption = hasList ? matches[activeIndex] : undefined

  return (
    <Dialog
      className="app-dialog app-dialog--add-form"
      open={addFormOpen}
      onClose={close}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DialogTitle>Add a form</DialogTitle>
      <DialogBody>
        <div className="app-dialog__body stack">
          <Field className="app-dialog__field">
            <FieldLabel htmlFor={inputId}>Form type</FieldLabel>
            <Input
              ref={searchRef}
              id={inputId}
              plain
              autoComplete="off"
              placeholder="Search forms…"
              value={query}
              role="combobox"
              aria-expanded={hasList}
              aria-controls={hasList ? listId : undefined}
              aria-activedescendant={
                activeOption ? optionId(activeIndex) : undefined
              }
              aria-autocomplete="list"
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onSearchKeyDown}
            />
            <div
              id={hasList ? listId : undefined}
              role={hasList ? 'listbox' : undefined}
              aria-label={hasList ? 'Form types' : undefined}
              className="add-form-results"
              onMouseDown={(e) => e.preventDefault()}
            >
              {matches.length === 0 ? (
                <div className="add-form-results__empty">No matching form</div>
              ) : (
                matches.map((option, index) => {
                  const active = index === activeIndex
                  const selected = option.value === type
                  return (
                    <div
                      key={option.value}
                      id={optionId(index)}
                      ref={active ? activeRef : undefined}
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      data-active={active ? 'true' : undefined}
                      className="add-form-results__item"
                      onPointerEnter={() => setActiveIndex(index)}
                      onClick={() => pick(option.value)}
                    >
                      {option.label}
                    </div>
                  )
                })
              )}
            </div>
          </Field>

          {type === '1099_NEC' ? (
            <Field className="app-dialog__field">
              <FieldLabel>Report on business (Schedule C)</FieldLabel>
              <Select
                style={{ width: '100%' }}
                options={scheduleCOptions}
                value={scheduleCChoice}
                onValueChange={setScheduleCChoice}
              />
            </Field>
          ) : null}
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!type} onClick={handleAdd}>
          Add form
        </Button>
      </DialogActions>
    </Dialog>
  )
}
