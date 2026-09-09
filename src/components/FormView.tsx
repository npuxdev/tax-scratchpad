import { useEffect } from 'react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { BASICS_SELECTION } from '../app/packet'
import { BasicsEditor } from './BasicsEditor'
import type { FieldValue } from '../tax/types'
import { W2Form } from '../forms/renderers/W2Form'
import { Form1099Int } from '../forms/renderers/Form1099Int'
import { Form1099Div } from '../forms/renderers/Form1099Div'
import { Form1099Nec } from '../forms/renderers/Form1099Nec'
import { ScheduleC } from '../forms/renderers/ScheduleC'
import { ScheduleA } from '../forms/renderers/ScheduleA'
import { Form1040 } from '../forms/renderers/Form1040'
import { Schedule1 } from '../forms/renderers/Schedule1'
import { Schedule2 } from '../forms/renderers/Schedule2'
import { ScheduleSE } from '../forms/renderers/ScheduleSE'
import { Schedule8812 } from '../forms/renderers/Schedule8812'

/** Scroll/highlight/focus a form field selected via the command palette. */
function useFormFieldFocus(fieldId: string | null) {
  useEffect(() => {
    if (!fieldId) return
    let timer: number | undefined
    const frame = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-field-id="${CSS.escape(fieldId)}"]`,
      )
      if (!el) return
      el.classList.add('tax-line--focused')
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      const input = el.querySelector<HTMLElement>('input, textarea, button')
      input?.focus()
      timer = window.setTimeout(() => {
        el.classList.remove('tax-line--focused')
      }, 1600)
    })
    return () => {
      cancelAnimationFrame(frame)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [fieldId])
}

export function FormView() {
  const {
    activeScenario,
    calculation,
    selectedFormId,
    selectedFieldId,
    dispatch,
  } = useAppStore()
  const { openTrace } = useUiState()

  useFormFieldFocus(selectedFieldId)

  if (!activeScenario) return null

  if (selectedFormId === BASICS_SELECTION) {
    return <BasicsEditor />
  }

  if (selectedFormId && selectedFormId.startsWith('calc:')) {
    const key = selectedFormId.slice('calc:'.length)
    switch (key) {
      case '1040':
        return (
          <Form1040
            scenario={activeScenario}
            calculation={calculation}
            onTrace={openTrace}
          />
        )
      case 'schedule1':
        return <Schedule1 calculation={calculation} onTrace={openTrace} />
      case 'schedule2':
        return <Schedule2 calculation={calculation} onTrace={openTrace} />
      case 'scheduleSE':
        return <ScheduleSE calculation={calculation} onTrace={openTrace} />
      case 'schedule8812':
        return <Schedule8812 calculation={calculation} onTrace={openTrace} />
      default:
        break
    }
  }

  const form = activeScenario.forms.find((f) => f.id === selectedFormId)
  if (!form) {
    // Null/unknown selection: show Form 1040 rather than an empty dead-end.
    // Do not write selectedFormId — Scratchpad still treats null as “all inputs”.
    return (
      <Form1040
        scenario={activeScenario}
        calculation={calculation}
        onTrace={openTrace}
      />
    )
  }

  const setValue = (fieldId: string, value: FieldValue) =>
    dispatch({ type: 'SET_FORM_VALUE', formId: form.id, fieldId, value })

  switch (form.type) {
    case 'W2':
      return <W2Form form={form} setValue={setValue} />
    case '1099_INT':
      return <Form1099Int form={form} setValue={setValue} />
    case '1099_DIV':
      return <Form1099Div form={form} setValue={setValue} />
    case '1099_NEC':
      return <Form1099Nec form={form} setValue={setValue} />
    case 'SCHEDULE_C':
      return (
        <ScheduleC
          form={form}
          setValue={setValue}
          calculation={calculation}
          onTrace={openTrace}
        />
      )
    case 'SCHEDULE_A':
      return (
        <ScheduleA
          form={form}
          setValue={setValue}
          calculation={calculation}
          onTrace={openTrace}
        />
      )
    case 'BASICS':
      return <BasicsEditor />
  }
}
