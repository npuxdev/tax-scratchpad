import type { TaxFormInstance, TaxScenario } from '../tax/types'

/** Input forms stored on the scenario (excludes derived IRS forms). */
export function selectInputForms(scenario: TaxScenario): TaxFormInstance[] {
  return scenario.forms
}

export function selectFormById(
  scenario: TaxScenario,
  formId: string,
): TaxFormInstance | undefined {
  return scenario.forms.find((form) => form.id === formId)
}

export function selectScheduleCForms(
  scenario: TaxScenario,
): TaxFormInstance[] {
  return scenario.forms.filter((form) => form.type === 'SCHEDULE_C')
}

export function selectLinkedNECs(
  scenario: TaxScenario,
  scheduleCId: string,
): TaxFormInstance[] {
  return scenario.forms.filter(
    (form) =>
      form.type === '1099_NEC' &&
      form.relationships?.scheduleCId === scheduleCId,
  )
}

/**
 * Count of input forms on the scenario.
 * Derived forms (1040, Schedule 1, etc.) can be added by a later helper.
 */
export function countForms(scenario: TaxScenario): number {
  return scenario.forms.length
}
