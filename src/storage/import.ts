import { createId } from '../state/scenario'
import type {
  FilingStatus,
  TaxFormInstance,
  TaxFormType,
  TaxScenario,
} from '../tax/types'

const FILING_STATUSES: readonly FilingStatus[] = [
  'single',
  'married_joint',
  'married_separate',
  'head_of_household',
] as const

const FORM_TYPES: readonly TaxFormType[] = [
  'W2',
  '1099_INT',
  '1099_DIV',
  '1099_NEC',
  'SCHEDULE_C',
  'SCHEDULE_A',
  'BASICS',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function isFilingStatus(value: unknown): value is FilingStatus {
  return (
    typeof value === 'string' &&
    (FILING_STATUSES as readonly string[]).includes(value)
  )
}

function isFormType(value: unknown): value is TaxFormType {
  return (
    typeof value === 'string' &&
    (FORM_TYPES as readonly string[]).includes(value)
  )
}

function validateForm(form: unknown, index: number): TaxFormInstance {
  assert(isRecord(form), `forms[${index}] must be an object`)
  assert(typeof form.id === 'string' && form.id.length > 0, `forms[${index}].id is required`)
  assert(isFormType(form.type), `forms[${index}].type is invalid`)
  assert(typeof form.label === 'string', `forms[${index}].label must be a string`)
  assert(isRecord(form.values), `forms[${index}].values must be an object`)

  let relationships: TaxFormInstance['relationships']
  if (form.relationships !== undefined) {
    assert(
      isRecord(form.relationships),
      `forms[${index}].relationships must be an object`,
    )
    if (form.relationships.scheduleCId !== undefined) {
      assert(
        typeof form.relationships.scheduleCId === 'string',
        `forms[${index}].relationships.scheduleCId must be a string`,
      )
      relationships = { scheduleCId: form.relationships.scheduleCId }
    } else {
      relationships = {}
    }
  }

  return {
    id: form.id,
    type: form.type,
    label: form.label,
    values: form.values as TaxFormInstance['values'],
    ...(form.owner === 'taxpayer' || form.owner === 'spouse'
      ? { owner: form.owner }
      : {}),
    ...(relationships ? { relationships } : {}),
  }
}

function validateScenario(raw: unknown): TaxScenario {
  assert(isRecord(raw), 'scenario must be an object')
  assert(typeof raw.id === 'string' && raw.id.length > 0, 'scenario.id is required')
  assert(typeof raw.name === 'string', 'scenario.name must be a string')
  assert(raw.schemaVersion === 1, 'scenario.schemaVersion must be 1')
  assert(raw.taxYear === 2025, 'scenario.taxYear must be 2025')
  assert(raw.ruleSet === 'federal-2025-v1', 'scenario.ruleSet must be federal-2025-v1')
  assert(typeof raw.createdAt === 'string', 'scenario.createdAt must be a string')
  assert(typeof raw.updatedAt === 'string', 'scenario.updatedAt must be a string')
  assert(isRecord(raw.basics), 'scenario.basics must be an object')
  assert(
    isFilingStatus(raw.basics.filingStatus),
    'scenario.basics.filingStatus is invalid',
  )
  assert(Array.isArray(raw.dependents), 'scenario.dependents must be an array')
  assert(Array.isArray(raw.forms), 'scenario.forms must be an array')
  assert(
    typeof raw.estimatedPayments === 'number' &&
      Number.isFinite(raw.estimatedPayments),
    'scenario.estimatedPayments must be a number',
  )

  const forms = raw.forms.map((form, index) => validateForm(form, index))
  const formIds = new Set(forms.map((f) => f.id))

  for (const form of forms) {
    if (form.type === '1099_NEC' && form.relationships?.scheduleCId) {
      assert(
        formIds.has(form.relationships.scheduleCId),
        `1099-NEC "${form.label}" references missing Schedule C id ${form.relationships.scheduleCId}`,
      )
      const scheduleC = forms.find(
        (f) => f.id === form.relationships?.scheduleCId,
      )
      assert(
        scheduleC?.type === 'SCHEDULE_C',
        `1099-NEC "${form.label}" scheduleCId must point to a SCHEDULE_C form`,
      )
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    schemaVersion: 1,
    taxYear: 2025,
    ruleSet: 'federal-2025-v1',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    basics: raw.basics as unknown as TaxScenario['basics'],
    dependents: raw.dependents as unknown as TaxScenario['dependents'],
    forms,
    estimatedPayments: raw.estimatedPayments,
  }
}

export interface ImportOptions {
  regenerateIds?: boolean
}

export function importScenarioDocument(
  raw: unknown,
  options: ImportOptions = {},
): TaxScenario {
  assert(isRecord(raw), 'Import document must be an object')
  assert(raw.schemaVersion === 1, 'Unsupported schemaVersion (expected 1)')
  assert(raw.taxYear === 2025, 'Unsupported taxYear (expected 2025)')
  assert(
    raw.ruleSet === 'federal-2025-v1',
    'Unsupported ruleSet (expected federal-2025-v1)',
  )
  assert('scenario' in raw, 'Import document missing scenario')

  const scenario = validateScenario(raw.scenario)

  // Validate envelope matches scenario metadata
  assert(raw.schemaVersion === scenario.schemaVersion, 'schemaVersion mismatch')
  assert(raw.taxYear === scenario.taxYear, 'taxYear mismatch')
  assert(raw.ruleSet === scenario.ruleSet, 'ruleSet mismatch')

  if (!options.regenerateIds) {
    return scenario
  }

  const timestamp = new Date().toISOString()
  const idMap = new Map<string, string>()
  for (const form of scenario.forms) {
    idMap.set(form.id, createId())
  }

  return {
    ...scenario,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    dependents: scenario.dependents.map((dependent) => ({
      ...dependent,
      id: createId(),
    })),
    forms: scenario.forms.map((form) => {
      const scheduleCId = form.relationships?.scheduleCId
      const mappedScheduleCId = scheduleCId
        ? idMap.get(scheduleCId)
        : undefined
      return {
        ...form,
        id: idMap.get(form.id)!,
        values: { ...form.values },
        relationships: mappedScheduleCId
          ? { ...form.relationships, scheduleCId: mappedScheduleCId }
          : form.relationships
            ? { ...form.relationships }
            : undefined,
      }
    }),
  }
}

export function importScenarioJson(
  json: string,
  options?: ImportOptions,
): TaxScenario {
  let parsed: unknown
  try {
    parsed = JSON.parse(json) as unknown
  } catch {
    throw new Error('Import document is not valid JSON')
  }
  return importScenarioDocument(parsed, options)
}
