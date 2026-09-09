import { money } from '../tax/money'
import type {
  Cents,
  Federal2025Result,
  FieldValue,
  TaxFormInstance,
  TaxFormType,
  TaxScenario,
} from '../tax/types'
import { FORM_TYPE_LABELS } from './labels'

export const ALL_SELECTION = 'all'
export const BASICS_SELECTION = 'basics'

export type PacketKind = 'basics' | 'input' | 'calculated'

export interface PacketItem {
  /** Selection id stored in `selectedFormId`. */
  id: string
  label: string
  sublabel?: string
  kind: PacketKind
  /** For input / editable forms, the underlying form instance id. */
  formInstanceId?: string
  formType?: TaxFormType
  /** Derived-form key when this is a pure calculated form. */
  derivedKey?: DerivedFormKey
}

export type DerivedFormKey =
  | 'form1040'
  | 'schedule1'
  | 'schedule2'
  | 'scheduleSE'
  | 'schedule8812'

export interface PacketModel {
  inputs: PacketItem[]
  calculated: PacketItem[]
}

function hasDerivedValues(
  rec: Record<string, FieldValue> | undefined,
): boolean {
  if (!rec) return false
  return Object.values(rec).some(
    (v) => v !== null && v !== '' && v !== 0 && v !== false,
  )
}

function inputLabel(form: TaxFormInstance): { label: string; sublabel?: string } {
  const base = FORM_TYPE_LABELS[form.type]
  const name = form.label && form.label !== base ? form.label : undefined
  return { label: base, sublabel: name }
}

/** Builds the ordered packet rail model from the scenario and calculation. */
export function buildPacket(
  scenario: TaxScenario,
  calculation: Federal2025Result | null,
): PacketModel {
  const inputs: PacketItem[] = [
    { id: BASICS_SELECTION, label: 'Basics', kind: 'basics' },
  ]

  for (const form of scenario.forms) {
    const { label, sublabel } = inputLabel(form)
    inputs.push({
      id: form.id,
      label,
      sublabel,
      kind: 'input',
      formInstanceId: form.id,
      formType: form.type,
    })
  }

  const calculated: PacketItem[] = []
  const forms = calculation?.forms
  const totals = calculation?.totals

  // Form 1040 — always shown once a scenario exists.
  calculated.push({
    id: 'calc:1040',
    label: 'Form 1040',
    kind: 'calculated',
    derivedKey: 'form1040',
  })

  const scheduleCForms = scenario.forms.filter((f) => f.type === 'SCHEDULE_C')
  const hasNec = scenario.forms.some((f) => f.type === '1099_NEC')
  const scheduleAForm = scenario.forms.find((f) => f.type === 'SCHEDULE_A')

  // Schedule 1 — adjustments or additional income.
  if (
    hasDerivedValues(forms?.schedule1) ||
    scheduleCForms.length > 0 ||
    hasNec
  ) {
    calculated.push({
      id: 'calc:schedule1',
      label: 'Schedule 1',
      sublabel: 'Additional income & adjustments',
      kind: 'calculated',
      derivedKey: 'schedule1',
    })
  }

  // Schedule 2 — SE tax / other taxes.
  if (
    hasDerivedValues(forms?.schedule2) ||
    (totals?.selfEmploymentTax ?? 0) > 0 ||
    (totals?.additionalMedicareTax ?? 0) > 0
  ) {
    calculated.push({
      id: 'calc:schedule2',
      label: 'Schedule 2',
      sublabel: 'Additional taxes',
      kind: 'calculated',
      derivedKey: 'schedule2',
    })
  }

  // Schedule A — present only when the itemized-deductions form exists.
  if (scheduleAForm) {
    calculated.push({
      id: scheduleAForm.id,
      label: 'Schedule A',
      sublabel: 'Itemized deductions',
      kind: 'calculated',
      formInstanceId: scheduleAForm.id,
      formType: 'SCHEDULE_A',
    })
  }

  // Schedule C — one per business.
  for (const sc of scheduleCForms) {
    const businessName =
      typeof sc.values.businessName === 'string' && sc.values.businessName
        ? sc.values.businessName
        : sc.label
    calculated.push({
      id: sc.id,
      label: 'Schedule C',
      sublabel: businessName,
      kind: 'calculated',
      formInstanceId: sc.id,
      formType: 'SCHEDULE_C',
    })
  }

  // Schedule SE — self-employment tax.
  if (
    hasDerivedValues(forms?.scheduleSE) ||
    (totals?.selfEmploymentTax ?? 0) > 0 ||
    scheduleCForms.length > 0
  ) {
    calculated.push({
      id: 'calc:scheduleSE',
      label: 'Schedule SE',
      sublabel: 'Self-employment tax',
      kind: 'calculated',
      derivedKey: 'scheduleSE',
    })
  }

  // Schedule 8812 — dependents / credits.
  if (hasDerivedValues(forms?.schedule8812) || scenario.dependents.length > 0) {
    calculated.push({
      id: 'calc:schedule8812',
      label: 'Schedule 8812',
      sublabel: 'Credits for qualifying children',
      kind: 'calculated',
      derivedKey: 'schedule8812',
    })
  }

  return { inputs, calculated }
}

export function findPacketItem(
  model: PacketModel,
  id: string | null,
): PacketItem | undefined {
  if (!id) return undefined
  return [...model.inputs, ...model.calculated].find((item) => item.id === id)
}

export function formatMoneyValue(value: Cents | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return money.format(value)
}
