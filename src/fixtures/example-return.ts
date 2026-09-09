import { money } from '../tax/money'
import type { Cents, TaxScenario } from '../tax/types'
import { createEmptyScenario, createFormInstance } from '../state/scenario'

/** Expected results for the IRS tax-table regression example (MFJ). */
export const EXPECTED_EXAMPLE_RETURN = {
  wages: money.fromDollars(56_800),
  withholding: money.fromDollars(3_000),
  income: money.fromDollars(56_800),
  standardDeduction: money.fromDollars(31_500),
  taxableIncome: money.fromDollars(25_300),
  tax: money.fromDollars(2_562),
  refund: money.fromDollars(438),
} as const satisfies Record<string, Cents>

/**
 * Example MFJ return matching the IRS Tax Table regression:
 * wages $56,800 − standard deduction $31,500 = taxable $25,300 → tax $2,562;
 * withholding $3,000 → refund $438.
 */
export function createExampleReturn(): TaxScenario {
  const scenario = createEmptyScenario('Example return', 'married_joint')
  const wages = EXPECTED_EXAMPLE_RETURN.wages
  const withholding = EXPECTED_EXAMPLE_RETURN.withholding
  // Employee FICA rates (informational W-2 boxes).
  const ssTax = money.multiplyRate(wages, 0.062)
  const medicareTax = money.multiplyRate(wages, 0.0145)

  const w2 = createFormInstance('W2', 'W-2 · Example employer')
  w2.values = {
    ...w2.values,
    employerName: 'Example employer',
    box1: wages,
    box2: withholding,
    box3: wages,
    box4: ssTax,
    box5: wages,
    box6: medicareTax,
  }

  return {
    ...scenario,
    forms: [w2],
    basics: {
      ...scenario.basics,
      taxpayerName: 'Alex Taxpayer',
      spouseName: 'Jordan Taxpayer',
    },
  }
}

export const exampleReturnScenario: TaxScenario = createExampleReturn()
