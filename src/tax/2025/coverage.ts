import type {
  CoverageIssue,
  CoverageResult,
  CoverageStatus,
  FieldValue,
  FormFieldDefinition,
  TaxScenario,
} from '../types'
import { getFormDefinition } from '../../forms/definitions'
import { moneyValue } from './form-1040'

/**
 * Decide whether a field value is "meaningful" — i.e. present and non-default —
 * so that an `unsupported-trigger` field should actually flag the return.
 */
function isMeaningful(field: FormFieldDefinition, value: FieldValue): boolean {
  if (value === null || value === undefined) return false
  switch (field.dataType) {
    case 'money':
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) && value !== 0
    case 'boolean':
      return value === true
    case 'text':
    case 'enum':
    case 'date':
      return typeof value === 'string' && value.trim() !== ''
    default:
      return false
  }
}

function resolveStatus(issues: CoverageIssue[]): CoverageStatus {
  if (issues.some((i) => i.status === 'unsupported')) return 'unsupported'
  if (issues.some((i) => i.status === 'needs-input')) return 'needs-input'
  return 'exact'
}

/**
 * Scan a scenario for anything the 2025 engine cannot compute exactly.
 *
 * Sources of issues:
 *  - Form definition fields marked `calculationUse === 'unsupported-trigger'`
 *    that carry a meaningful value.
 *  - Age 65+ or blindness (additional standard deduction not implemented).
 *  - Qualified dividends greater than ordinary dividends (data/validation issue).
 *
 * The engine still computes a full result for debugging; the UI must not surface
 * a refund/balance-due figure unless coverage is `exact`.
 */
export function scanCoverage(scenario: TaxScenario): CoverageResult {
  const issues: CoverageIssue[] = []

  // 1. Unsupported-trigger fields with meaningful values.
  for (const form of scenario.forms) {
    const def = getFormDefinition(form.type)
    for (const field of def.fields) {
      if (field.calculationUse !== 'unsupported-trigger') continue
      const value = form.values[field.id]
      if (!isMeaningful(field, value)) continue
      issues.push({
        id: `unsupported:${form.id}:${field.id}`,
        status: 'unsupported',
        message: `${def.formNumber} — "${field.label}" is not supported in the 2025 engine yet.`,
        formId: form.id,
        fieldId: field.id,
      })
    }
  }

  // 2. Age 65+ or blindness → additional standard deduction not implemented.
  const b = scenario.basics
  const spouseAge = b.spouseAgeAtEndOfYear ?? 0
  if (b.taxpayerAgeAtEndOfYear >= 65) {
    issues.push({
      id: 'unsupported:taxpayer-age-65',
      status: 'unsupported',
      message:
        'Taxpayer is 65 or older; the additional standard deduction for age is not implemented.',
    })
  }
  if (b.filingStatus === 'married_joint' && spouseAge >= 65) {
    issues.push({
      id: 'unsupported:spouse-age-65',
      status: 'unsupported',
      message:
        'Spouse is 65 or older; the additional standard deduction for age is not implemented.',
    })
  }
  if (b.taxpayerBlind) {
    issues.push({
      id: 'unsupported:taxpayer-blind',
      status: 'unsupported',
      message:
        'Taxpayer is blind; the additional standard deduction for blindness is not implemented.',
    })
  }
  if (b.spouseBlind) {
    issues.push({
      id: 'unsupported:spouse-blind',
      status: 'unsupported',
      message:
        'Spouse is blind; the additional standard deduction for blindness is not implemented.',
    })
  }

  // 3. Per 1099-DIV validation: qualified dividends cannot exceed ordinary dividends.
  for (const form of scenario.forms) {
    if (form.type !== '1099_DIV') continue
    const ordinary = moneyValue(form.values.box1a)
    const qualified = moneyValue(form.values.box1b)
    if (qualified > ordinary) {
      issues.push({
        id: `needs-input:${form.id}:qd-gt-ordinary`,
        status: 'needs-input',
        message:
          '1099-DIV — qualified dividends (box 1b) exceed ordinary dividends (box 1a). Please correct the entry.',
        formId: form.id,
        fieldId: 'box1b',
      })
    }
  }

  return { status: resolveStatus(issues), issues }
}
