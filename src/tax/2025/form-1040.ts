import type { Cents, FieldValue, TaxFormInstance, TaxFormType } from '../types'

/**
 * Read a form field value as integer cents.
 * Anything that is not a finite number (null/undefined/string/boolean) is treated as 0.
 */
export function moneyValue(v: FieldValue): Cents {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Read a boolean field value, defaulting to false. */
export function boolValue(v: FieldValue): boolean {
  return v === true
}

/** Read a numeric (non-money) field value, defaulting to 0. */
export function numberValue(v: FieldValue): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** All forms of a given type. */
export function formsOfType(
  forms: TaxFormInstance[],
  type: TaxFormType,
): TaxFormInstance[] {
  return forms.filter((f) => f.type === type)
}

/**
 * Sum a single money field (by field id) across every form of a type.
 */
export function sumFieldAcrossForms(
  forms: TaxFormInstance[],
  type: TaxFormType,
  fieldId: string,
): Cents {
  let total = 0
  for (const form of forms) {
    if (form.type !== type) continue
    total += moneyValue(form.values[fieldId])
  }
  return total
}
