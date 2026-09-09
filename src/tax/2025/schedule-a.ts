import type {
  CalculationGraph,
  Cents,
  FilingStatus,
  TaxFormInstance,
} from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import {
  MEDICAL_FLOOR_RATE,
  SALT_CAP,
  SALT_FLOOR,
  SALT_PHASEOUT_RATE,
  SALT_PHASEOUT_THRESHOLD,
  SOURCE_MEDICAL,
  SOURCE_SALT,
} from './constants'
import { moneyValue } from './form-1040'

export interface ScheduleAResult {
  medicalDeductible: Cents
  saltRaw: Cents
  saltCap: Cents
  saltDeductible: Cents
  mortgageInterest: Cents
  charitable: Cents
  total: Cents
  totalNodeId: string
}

function isMarriedSeparate(status: FilingStatus): boolean {
  return status === 'married_separate'
}

/**
 * Compute Schedule A itemized deductions.
 *
 * - Medical: deductible only above 7.5% of AGI.
 * - SALT: capped at the 2025 cap ($40k / $20k MFS), phased down 30% of MAGI over
 *   the threshold ($500k / $250k MFS) but never below the floor ($10k / $5k MFS).
 * - Mortgage interest and charitable are taken as user-determined deductible amounts.
 */
export function computeScheduleA(
  form: TaxFormInstance,
  agi: Cents,
  filingStatus: FilingStatus,
  graph: CalculationGraph,
): ScheduleAResult {
  const mfs = isMarriedSeparate(filingStatus)

  // Medical with 7.5% AGI floor.
  const medicalExpenses = moneyValue(form.values.medical)
  const medicalFloor = money.roundNearestCent(agi * MEDICAL_FLOOR_RATE)
  const medicalDeductible = money.max(
    money.zero,
    money.subtract(medicalExpenses, medicalFloor),
  )
  addNode(graph, {
    id: 'scheduleA:medical',
    label: 'Deductible medical & dental',
    value: medicalDeductible,
    kind: 'difference',
    inputs: [],
    destination: { form: 'Schedule A', line: '4' },
    rule: 'Medical expenses minus 7.5% of AGI (not below zero)',
    sourceAuthority: SOURCE_MEDICAL,
    children: [
      { label: 'Medical expenses', value: medicalExpenses },
      { label: '7.5% of AGI floor', value: -medicalFloor },
    ],
  })

  // SALT: income/property/personal taxes, capped and phased down.
  const stateLocalIncomeTax = moneyValue(form.values.stateLocalIncomeTax)
  const realEstateTax = moneyValue(form.values.realEstateTax)
  const personalPropertyTax = moneyValue(form.values.personalPropertyTax)
  const saltRaw = money.add(
    stateLocalIncomeTax,
    realEstateTax,
    personalPropertyTax,
  )

  const baseCap = mfs ? SALT_CAP.married_separate : SALT_CAP.default
  const floor = mfs ? SALT_FLOOR.married_separate : SALT_FLOOR.default
  const phaseoutThreshold = mfs
    ? SALT_PHASEOUT_THRESHOLD.married_separate
    : SALT_PHASEOUT_THRESHOLD.default
  const excessOverThreshold = money.max(
    money.zero,
    money.subtract(agi, phaseoutThreshold),
  )
  const phaseDown = money.roundNearestCent(
    excessOverThreshold * SALT_PHASEOUT_RATE,
  )
  const saltCap = money.max(floor, money.subtract(baseCap, phaseDown))
  const saltDeductible = money.min(saltRaw, saltCap)

  addNode(graph, {
    id: 'scheduleA:salt',
    label: 'State and local taxes (SALT)',
    value: saltDeductible,
    kind: 'minimum',
    inputs: [],
    destination: { form: 'Schedule A', line: '5e' },
    rule: `SALT limited to cap = max(floor, base cap − 30% of AGI over threshold); base cap $${
      baseCap / 100
    }, floor $${floor / 100}, threshold $${phaseoutThreshold / 100}`,
    sourceAuthority: SOURCE_SALT,
    children: [
      { label: 'State/local income tax', value: stateLocalIncomeTax },
      { label: 'Real estate tax', value: realEstateTax },
      { label: 'Personal property tax', value: personalPropertyTax },
      { label: 'Raw SALT (uncapped)', value: saltRaw },
      { label: 'Phase-down (30% of AGI over threshold)', value: -phaseDown },
      { label: 'Effective SALT cap', value: saltCap },
    ],
  })

  const mortgageInterest = moneyValue(form.values.mortgageInterest)
  addNode(graph, {
    id: 'scheduleA:mortgage',
    label: 'Home mortgage interest',
    value: mortgageInterest,
    kind: 'input',
    inputs: [],
    destination: { form: 'Schedule A', line: '8e' },
  })

  const charitable = money.add(
    moneyValue(form.values.charitableCash),
    moneyValue(form.values.charitableNonCash),
  )
  addNode(graph, {
    id: 'scheduleA:charitable',
    label: 'Charitable contributions',
    value: charitable,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Schedule A', line: '14' },
  })

  const total = money.add(
    medicalDeductible,
    saltDeductible,
    mortgageInterest,
    charitable,
  )
  const totalNodeId = 'scheduleA:total'
  addNode(graph, {
    id: totalNodeId,
    label: 'Total itemized deductions',
    value: total,
    kind: 'sum',
    inputs: [
      'scheduleA:medical',
      'scheduleA:salt',
      'scheduleA:mortgage',
      'scheduleA:charitable',
    ],
    destination: { form: 'Schedule A', line: '17' },
  })

  return {
    medicalDeductible,
    saltRaw,
    saltCap,
    saltDeductible,
    mortgageInterest,
    charitable,
    total,
    totalNodeId,
  }
}
