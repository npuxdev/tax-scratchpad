import type {
  CoverageStatus,
  Federal2025Totals,
  FieldValue,
  TaxYear,
  RuleSet,
} from '../tax/types'

export type ComparisonValueType =
  | 'money'
  | 'text'
  | 'boolean'
  | 'number'
  | 'enum'

export type ComparisonSection = 'calculations' | 'inputs'

export type ComparisonRowKind = 'presence' | 'value'

/** One aligned row in the comparison. `values[i]` belongs to `scenarios[i]`. */
export interface ComparisonRow {
  id: string
  section: ComparisonSection
  kind: ComparisonRowKind
  group: string
  label: string
  valueType: ComparisonValueType
  values: Array<FieldValue | null>
}

export interface ComparisonScenarioRef {
  id: string
  name: string
  coverage: CoverageStatus
  totals: Federal2025Totals
}

export interface ScenarioComparisonDocument {
  schemaVersion: 1
  kind: 'scenario-comparison'
  taxYear: TaxYear
  ruleSet: RuleSet
  comparedAt: string
  /** First entry is the baseline column. */
  scenarios: ComparisonScenarioRef[]
  calculations: ComparisonRow[]
  inputs: ComparisonRow[]
  summary: {
    calculationCount: number
    inputCount: number
    identical: boolean
  }
}
