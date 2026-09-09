import type { Cents, FieldValue, TaxFormInstance } from '../../tax/types'

export interface InputRendererProps {
  form: TaxFormInstance
  setValue: (fieldId: string, value: FieldValue) => void
}

/** Read a stored value as cents (defaults to 0). */
export function centsOf(form: TaxFormInstance, id: string): Cents {
  const v = form.values[id]
  return typeof v === 'number' ? v : 0
}

/** Read a stored value as a string (defaults to ''). */
export function textOf(form: TaxFormInstance, id: string): string {
  const v = form.values[id]
  return typeof v === 'string' ? v : ''
}

/** Read a stored value as a boolean. */
export function boolOf(form: TaxFormInstance, id: string): boolean {
  return form.values[id] === true
}
