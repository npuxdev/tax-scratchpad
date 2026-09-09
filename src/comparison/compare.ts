import { FILING_STATUS_LABELS, FORM_TYPE_LABELS } from '../app/labels'
import { getFormDefinition } from '../forms/definitions'
import { calculateFederal2025 } from '../tax/2025/calculate'
import { money } from '../tax/money'
import type {
  Dependent,
  Federal2025Result,
  Federal2025Totals,
  FieldDataType,
  FieldValue,
  TaxFormInstance,
  TaxFormType,
  TaxpayerBasics,
  TaxScenario,
} from '../tax/types'
import type {
  ComparisonRow,
  ComparisonValueType,
  ScenarioComparisonDocument,
} from './types'

const FORM_TYPE_ORDER: TaxFormType[] = [
  'W2',
  '1099_INT',
  '1099_DIV',
  '1099_NEC',
  'SCHEDULE_C',
  'SCHEDULE_A',
  'BASICS',
]

const TOTAL_ROWS: Array<{
  id: keyof Federal2025Totals
  label: string
  valueType: ComparisonValueType
}> = [
  { id: 'refundOrDue', label: 'Refund or amount due', valueType: 'money' },
  { id: 'totalTax', label: 'Total tax', valueType: 'money' },
  { id: 'income', label: 'Total income', valueType: 'money' },
  { id: 'adjustments', label: 'Adjustments to income', valueType: 'money' },
  { id: 'agi', label: 'Adjusted gross income', valueType: 'money' },
  { id: 'deductionType', label: 'Deduction type', valueType: 'enum' },
  { id: 'deductions', label: 'Deductions', valueType: 'money' },
  { id: 'taxableIncome', label: 'Taxable income', valueType: 'money' },
  { id: 'incomeTax', label: 'Income tax', valueType: 'money' },
  { id: 'nonrefundableCredits', label: 'Nonrefundable credits', valueType: 'money' },
  { id: 'selfEmploymentTax', label: 'Self-employment tax', valueType: 'money' },
  { id: 'additionalMedicareTax', label: 'Additional Medicare tax', valueType: 'money' },
  { id: 'withholding', label: 'Federal withholding', valueType: 'money' },
  { id: 'refundableCredits', label: 'Refundable credits', valueType: 'money' },
  { id: 'totalPayments', label: 'Total payments', valueType: 'money' },
]

const FORM_1040_LINES: Array<{ id: string; label: string }> = [
  { id: '1a', label: 'Wages (line 1a)' },
  { id: '2b', label: 'Taxable interest (line 2b)' },
  { id: '3a', label: 'Qualified dividends (line 3a)' },
  { id: '3b', label: 'Ordinary dividends (line 3b)' },
  { id: '7', label: 'Capital gain distributions (line 7)' },
]

const SCHEDULE_C_CALCS: Array<{
  id: 'grossReceipts' | 'costOfGoodsSold' | 'totalExpenses' | 'netProfit'
  label: string
}> = [
  { id: 'grossReceipts', label: 'Gross receipts' },
  { id: 'costOfGoodsSold', label: 'Cost of goods sold' },
  { id: 'totalExpenses', label: 'Total expenses' },
  { id: 'netProfit', label: 'Net profit' },
]

const DEPENDENT_FIELDS: Array<{
  id: keyof Dependent
  label: string
  valueType: ComparisonValueType
}> = [
  { id: 'name', label: 'Name', valueType: 'text' },
  { id: 'relationship', label: 'Relationship', valueType: 'text' },
  { id: 'ageAtEndOf2025', label: 'Age at end of 2025', valueType: 'number' },
  {
    id: 'livedWithTaxpayerMoreThanHalfYear',
    label: 'Lived with taxpayer more than half the year',
    valueType: 'boolean',
  },
  {
    id: 'providedMoreThanHalfOwnSupport',
    label: 'Provided more than half of own support',
    valueType: 'boolean',
  },
  { id: 'claimedAsDependent', label: 'Claimed as dependent', valueType: 'boolean' },
  {
    id: 'citizenNationalOrResidentAlien',
    label: 'U.S. citizen, national, or resident alien',
    valueType: 'boolean',
  },
  { id: 'validEmploymentSSN', label: 'Valid employment SSN', valueType: 'boolean' },
]

export interface CompareOptions {
  comparedAt?: string
}

export function compareScenarios(
  scenarios: TaxScenario[],
  options: CompareOptions = {},
): ScenarioComparisonDocument {
  if (scenarios.length < 2) {
    throw new Error('Comparison requires at least 2 scenarios')
  }

  const results = scenarios.map((scenario) => calculateFederal2025(scenario))
  const calculations = diffCalculations(scenarios, results)
  const inputs = diffInputs(scenarios)
  const comparedAt = options.comparedAt ?? new Date().toISOString()

  return {
    schemaVersion: 1,
    kind: 'scenario-comparison',
    taxYear: 2025,
    ruleSet: 'federal-2025-v1',
    comparedAt,
    scenarios: scenarios.map((scenario, index) => ({
      id: scenario.id,
      name: scenario.name,
      coverage: results[index]!.coverage.status,
      totals: results[index]!.totals,
    })),
    calculations,
    inputs,
    summary: {
      calculationCount: calculations.length,
      inputCount: inputs.length,
      identical: calculations.length === 0 && inputs.length === 0,
    },
  }
}

export function exportComparisonJson(
  comparison: ScenarioComparisonDocument,
): string {
  return JSON.stringify(comparison, null, 2)
}

export function comparisonDownloadName(
  comparison: ScenarioComparisonDocument,
): string {
  const names = comparison.scenarios
    .map((scenario) => scenario.name.replace(/[^\w.-]+/g, '-').toLowerCase())
    .filter(Boolean)
  if (names.length === 2) {
    return `comparison-${names[0]}-vs-${names[1]}.json`
  }
  return `comparison-${comparison.scenarios.length}-scenarios.json`
}

function diffCalculations(
  scenarios: TaxScenario[],
  results: Federal2025Result[],
): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  const coverageValues = results.map((result) => result.coverage.status)
  if (!allEqual(coverageValues)) {
    rows.push({
      id: 'coverage.status',
      section: 'calculations',
      kind: 'value',
      group: 'Projection',
      label: 'Coverage',
      valueType: 'enum',
      values: coverageValues,
    })
  }

  for (const spec of TOTAL_ROWS) {
    const values = results.map((result) => result.totals[spec.id] as FieldValue)
    if (!allEqual(values)) {
      rows.push({
        id: `totals.${spec.id}`,
        section: 'calculations',
        kind: 'value',
        group: 'Totals',
        label: spec.label,
        valueType: spec.valueType,
        values,
      })
    }
  }

  for (const line of FORM_1040_LINES) {
    const values = results.map(
      (result) => (result.forms.form1040[line.id] as FieldValue | undefined) ?? 0,
    )
    if (!hasDifference(values, 'money')) continue
    rows.push({
      id: `form1040.${line.id}`,
      section: 'calculations',
      kind: 'value',
      group: 'Form 1040',
      label: line.label,
      valueType: 'money',
      values,
    })
  }

  const alignedC = alignForms(scenarios, 'SCHEDULE_C')
  alignedC.forEach((forms, index) => {
    const group = alignedFormLabel(forms, index, alignedC.length)
    const present = forms.map((form) => form !== null)
    for (const spec of SCHEDULE_C_CALCS) {
      const values = forms.map((form, scenarioIndex) => {
        if (!form) return null
        const computed = results[scenarioIndex]!.forms.scheduleC[form.id]
        return computed ? computed[spec.id] : null
      })
      if (!shouldEmitValueRow(present, values, 'money')) continue
      rows.push({
        id: `scheduleC.${index}.${spec.id}`,
        section: 'calculations',
        kind: 'value',
        group,
        label: spec.label,
        valueType: 'money',
        values,
      })
    }
  })

  return rows
}

function diffInputs(scenarios: TaxScenario[]): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  rows.push(...diffBasics(scenarios))
  rows.push(...diffEstimatedPayments(scenarios))
  rows.push(...diffDependents(scenarios))
  rows.push(...diffForms(scenarios))
  return rows
}

function diffBasics(scenarios: TaxScenario[]): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  const anyJoint = scenarios.some((s) => s.basics.filingStatus === 'married_joint')

  const filing = scenarios.map((s) => s.basics.filingStatus)
  if (!allEqual(filing)) {
    rows.push({
      id: 'basics.filingStatus',
      section: 'inputs',
      kind: 'value',
      group: 'Basics',
      label: 'Filing status',
      valueType: 'enum',
      values: filing,
    })
  }

  const fields: Array<{
    id: keyof TaxpayerBasics
    label: string
    valueType: ComparisonValueType
    spouse?: boolean
  }> = [
    { id: 'taxpayerName', label: 'Taxpayer name', valueType: 'text' },
    { id: 'spouseName', label: 'Spouse name', valueType: 'text', spouse: true },
    {
      id: 'taxpayerAgeAtEndOfYear',
      label: 'Taxpayer age at end of 2025',
      valueType: 'number',
    },
    {
      id: 'spouseAgeAtEndOfYear',
      label: 'Spouse age at end of 2025',
      valueType: 'number',
      spouse: true,
    },
    { id: 'taxpayerBlind', label: 'Taxpayer is blind', valueType: 'boolean' },
    { id: 'spouseBlind', label: 'Spouse is blind', valueType: 'boolean', spouse: true },
    {
      id: 'taxpayerHasValidEmploymentSSN',
      label: 'Taxpayer has valid employment SSN',
      valueType: 'boolean',
    },
    {
      id: 'spouseHasValidSSNOrITIN',
      label: 'Spouse has valid SSN or ITIN',
      valueType: 'boolean',
      spouse: true,
    },
  ]

  for (const field of fields) {
    if (field.spouse && !anyJoint) continue
    const values = scenarios.map((s) => toFieldValue(s.basics[field.id]))
    if (!hasDifference(values, field.valueType)) continue
    rows.push({
      id: `basics.${field.id}`,
      section: 'inputs',
      kind: 'value',
      group: 'Basics',
      label: field.label,
      valueType: field.valueType,
      values,
    })
  }

  return rows
}

function diffEstimatedPayments(scenarios: TaxScenario[]): ComparisonRow[] {
  const values = scenarios.map((s) => s.estimatedPayments)
  if (allEqual(values)) return []
  return [
    {
      id: 'estimatedPayments',
      section: 'inputs',
      kind: 'value',
      group: 'Basics',
      label: 'Estimated payments',
      valueType: 'money',
      values,
    },
  ]
}

function diffDependents(scenarios: TaxScenario[]): ComparisonRow[] {
  const aligned = alignDependents(scenarios)
  const rows: ComparisonRow[] = []

  aligned.forEach((deps, index) => {
    const group = alignedDependentLabel(deps, index)
    const present = deps.map((dep) => dep !== null)
    if (!present.every(Boolean) && present.some(Boolean)) {
      rows.push(
        presenceRow(
          `dependent.${index}`,
          'inputs',
          'Dependents',
          group,
          present,
        ),
      )
    }
    for (const field of DEPENDENT_FIELDS) {
      const values = deps.map((dep) =>
        dep ? toFieldValue(dep[field.id]) : null,
      )
      if (!shouldEmitValueRow(present, values, field.valueType)) continue
      rows.push({
        id: `dependent.${index}.${field.id}`,
        section: 'inputs',
        kind: 'value',
        group,
        label: field.label,
        valueType: field.valueType,
        values,
      })
    }
  })

  return rows
}

function diffForms(scenarios: TaxScenario[]): ComparisonRow[] {
  const rows: ComparisonRow[] = []

  for (const type of FORM_TYPE_ORDER) {
    const aligned = alignForms(scenarios, type)
    aligned.forEach((forms, index) => {
      const group = alignedFormLabel(forms, index, aligned.length)
      const present = forms.map((form) => form !== null)
      if (!present.every(Boolean) && present.some(Boolean)) {
        rows.push(
          presenceRow(`form.${type}.${index}`, 'inputs', 'Forms', group, present),
        )
      }

      const labelValues = forms.map((form) => (form ? form.label : null))
      if (shouldEmitValueRow(present, labelValues, 'text')) {
        rows.push({
          id: `form.${type}.${index}.label`,
          section: 'inputs',
          kind: 'value',
          group,
          label: 'Label',
          valueType: 'text',
          values: labelValues,
        })
      }

      const ownerValues = forms.map((form) => form?.owner ?? null)
      if (shouldEmitValueRow(present, ownerValues, 'enum')) {
        rows.push({
          id: `form.${type}.${index}.owner`,
          section: 'inputs',
          kind: 'value',
          group,
          label: 'Owner',
          valueType: 'enum',
          values: ownerValues,
        })
      }

      if (type === '1099_NEC') {
        const linked = forms.map((form, scenarioIndex) =>
          form ? linkedScheduleCName(scenarios[scenarioIndex]!, form) : null,
        )
        if (shouldEmitValueRow(present, linked, 'text')) {
          rows.push({
            id: `form.${type}.${index}.scheduleC`,
            section: 'inputs',
            kind: 'value',
            group,
            label: 'Reported on Schedule C',
            valueType: 'text',
            values: linked,
          })
        }
      }

      const definition = getFormDefinition(type)
      for (const field of definition.fields) {
        const values = forms.map((form) =>
          form ? toFieldValue(form.values[field.id]) : null,
        )
        const valueType = dataTypeToValueType(field.dataType)
        if (!shouldEmitValueRow(present, values, valueType)) continue
        rows.push({
          id: `form.${type}.${index}.${field.id}`,
          section: 'inputs',
          kind: 'value',
          group,
          label: field.box ? `Box ${field.box} · ${field.label}` : field.label,
          valueType,
          values,
        })
      }
    })
  }

  return rows
}

function presenceRow(
  id: string,
  section: ComparisonRow['section'],
  group: string,
  label: string,
  present: boolean[],
): ComparisonRow {
  return {
    id: `${id}.presence`,
    section,
    kind: 'presence',
    group,
    label,
    valueType: 'enum',
    values: present.map((isPresent) => (isPresent ? 'present' : 'absent')),
  }
}

function alignForms(
  scenarios: TaxScenario[],
  type: TaxFormType,
): Array<Array<TaxFormInstance | null>> {
  const pools = scenarios.map((scenario) =>
    scenario.forms.filter((form) => form.type === type),
  )
  return alignByKey(pools, formIdentity)
}

function alignDependents(
  scenarios: TaxScenario[],
): Array<Array<Dependent | null>> {
  const pools = scenarios.map((scenario) => scenario.dependents)
  return alignByKey(pools, dependentIdentity)
}

function alignByKey<T>(
  pools: T[][],
  keyOf: (item: T) => string,
): Array<Array<T | null>> {
  const used = pools.map(() => new Set<number>())
  const groups: Array<Array<T | null>> = []
  const keys: string[] = []
  for (const pool of pools) {
    for (const item of pool) {
      const key = keyOf(item)
      if (!keys.includes(key)) keys.push(key)
    }
  }

  for (const key of keys) {
    const indexes = pools.map((pool) =>
      pool
        .map((item, index) => (keyOf(item) === key ? index : -1))
        .filter((index) => index >= 0),
    )
    const matchCount = Math.max(0, ...indexes.map((list) => list.length))
    for (let k = 0; k < matchCount; k++) {
      groups.push(
        pools.map((pool, scenarioIndex) => {
          const index = indexes[scenarioIndex]![k]
          if (index === undefined) return null
          used[scenarioIndex]!.add(index)
          return pool[index]!
        }),
      )
    }
  }

  const remainders = pools.map((pool, scenarioIndex) =>
    pool.filter((_, index) => !used[scenarioIndex]!.has(index)),
  )
  const leftover = Math.max(0, ...remainders.map((list) => list.length))
  for (let k = 0; k < leftover; k++) {
    groups.push(remainders.map((list) => list[k] ?? null))
  }

  return groups
}

function formIdentity(form: TaxFormInstance): string {
  const name = identityName(form)
  if (name) return `${form.type}::${normalizeKey(name)}`
  return `${form.type}::label:${normalizeKey(form.label)}`
}

function identityName(form: TaxFormInstance): string {
  const raw =
    form.type === 'W2'
      ? form.values.employerName
      : form.type === 'SCHEDULE_C'
        ? form.values.businessName
        : form.values.payerName
  return typeof raw === 'string' ? raw.trim() : ''
}

function dependentIdentity(dependent: Dependent): string {
  const name = dependent.name?.trim()
  return name ? `name:${normalizeKey(name)}` : `id:${dependent.id}`
}

function linkedScheduleCName(
  scenario: TaxScenario,
  form: TaxFormInstance,
): string | null {
  const scheduleCId = form.relationships?.scheduleCId
  if (!scheduleCId) return null
  const scheduleC = scenario.forms.find((item) => item.id === scheduleCId)
  if (!scheduleC) return null
  return identityName(scheduleC) || scheduleC.label
}

function alignedFormLabel(
  forms: Array<TaxFormInstance | null>,
  index: number,
  totalOfType: number,
): string {
  const form = forms.find((item) => item !== null)
  if (!form) return 'Form'
  const typeLabel = FORM_TYPE_LABELS[form.type]
  const name = identityName(form)
  const base = name
    ? `${typeLabel} · ${name}`
    : form.label && form.label !== typeLabel
      ? `${typeLabel} · ${form.label}`
      : typeLabel
  if (totalOfType > 1 && !name) return `${base} (#${index + 1})`
  return base
}

function alignedDependentLabel(
  deps: Array<Dependent | null>,
  index: number,
): string {
  const named = deps.find((dep) => dep?.name?.trim())
  if (named?.name?.trim()) return named.name.trim()
  return `Dependent ${index + 1}`
}

function shouldEmitValueRow(
  present: boolean[],
  values: Array<FieldValue | null>,
  valueType: ComparisonValueType,
): boolean {
  const presentValues = values.filter((_, index) => present[index])
  if (presentValues.length === 0) return false

  const presenceDiffers = present.some((isPresent) => isPresent !== present[0])
  if (presenceDiffers) {
    return presentValues.some((value) => !isDefaultValue(value, valueType))
  }

  return hasDifference(values, valueType)
}

function hasDifference(
  values: Array<FieldValue | null | undefined>,
  valueType: ComparisonValueType,
): boolean {
  if (values.length === 0) return false
  const first = values[0]
  return !values.every((value) => equalValue(value, first, valueType))
}

function equalValue(
  a: FieldValue | null | undefined,
  b: FieldValue | null | undefined,
  valueType: ComparisonValueType,
): boolean {
  if (Object.is(a, b)) return true
  switch (valueType) {
    case 'money': {
      const left = typeof a === 'number' && Number.isFinite(a) ? a : 0
      const right = typeof b === 'number' && Number.isFinite(b) ? b : 0
      return left === right
    }
    case 'boolean':
      return Boolean(a) === Boolean(b)
    case 'text':
    case 'enum': {
      const left = a === null || a === undefined ? '' : String(a)
      const right = b === null || b === undefined ? '' : String(b)
      return left === right
    }
    case 'number': {
      const aMissing = a === null || a === undefined
      const bMissing = b === null || b === undefined
      if (aMissing && bMissing) return true
      return a === b
    }
  }
}

function isDefaultValue(
  value: FieldValue | null | undefined,
  valueType: ComparisonValueType,
): boolean {
  switch (valueType) {
    case 'money':
      return !(typeof value === 'number' && value !== 0)
    case 'boolean':
      return !value
    case 'text':
    case 'enum':
      return value === null || value === undefined || value === ''
    case 'number':
      return value === null || value === undefined
  }
}

function allEqual<T>(values: T[]): boolean {
  if (values.length === 0) return true
  return values.every((value) => Object.is(value, values[0]))
}

function toFieldValue(
  value: FieldValue | undefined | null,
): FieldValue | null {
  return value === undefined ? null : value
}

function dataTypeToValueType(dataType: FieldDataType): ComparisonValueType {
  switch (dataType) {
    case 'money':
      return 'money'
    case 'boolean':
      return 'boolean'
    case 'number':
      return 'number'
    case 'enum':
      return 'enum'
    default:
      return 'text'
  }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function formatComparisonValue(
  row: ComparisonRow,
  index: number,
): string {
  const value = row.values[index]
  if (row.kind === 'presence') {
    return value === 'present' ? 'Included' : '—'
  }
  if (value === null || value === undefined) return '—'

  switch (row.valueType) {
    case 'money':
      if (typeof value !== 'number') return '—'
      if (row.id === 'totals.refundOrDue') {
        return money.format(value, { signed: true })
      }
      return money.format(value)
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'enum':
      return formatEnum(value)
    case 'number':
      return String(value)
    case 'text':
      return String(value) || '—'
  }
}

function formatEnum(value: FieldValue): string {
  if (typeof value !== 'string') return String(value)
  if (value === 'present') return 'Included'
  if (value === 'absent') return '—'
  if (value === 'standard') return 'Standard'
  if (value === 'itemized') return 'Itemized'
  if (value === 'exact') return 'Exact'
  if (value === 'needs-input') return 'Needs input'
  if (value === 'unsupported') return 'Unsupported'
  if (value in FILING_STATUS_LABELS) {
    return FILING_STATUS_LABELS[value as keyof typeof FILING_STATUS_LABELS]
  }
  if (value === 'taxpayer') return 'Taxpayer'
  if (value === 'spouse') return 'Spouse'
  return value
}

export function moneyDelta(
  row: ComparisonRow,
  index: number,
): number | null {
  if (row.valueType !== 'money' || index === 0) return null
  const baseline = row.values[0]
  const current = row.values[index]
  if (typeof baseline !== 'number' || typeof current !== 'number') return null
  const delta = current - baseline
  return delta === 0 ? null : delta
}

export function formatOutcome(refundOrDue: number, exact: boolean): string {
  if (!exact) return 'Incomplete'
  const amount = money.format(Math.abs(refundOrDue))
  if (refundOrDue >= 0) return `Refund ${amount}`
  return `Due ${amount}`
}
