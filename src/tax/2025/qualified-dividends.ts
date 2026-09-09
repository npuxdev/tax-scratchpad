import type { CalculationGraph, Cents, FilingStatus } from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import { QD_THRESHOLDS, SOURCE_QD_BRACKETS } from './constants'
import { computeOrdinaryTax } from './ordinary-tax'

export interface QualifiedDividendsInput {
  taxableIncome: Cents
  qualifiedDividends: Cents
  /** Eligible net capital gain (e.g. 1099-DIV box 2a total). */
  eligibleNetCapitalGain: Cents
  filingStatus: FilingStatus
}

export interface QualifiedDividendsResult {
  tax: Cents
  ordinaryPortion: Cents
  preferentialIncome: Cents
  taxedAt0: Cents
  taxedAt15: Cents
  taxedAt20: Cents
  taxAt15: Cents
  taxAt20: Cents
  ordinaryTax: Cents
  taxNodeId: string
}

/**
 * Qualified Dividends and Capital Gain Tax Worksheet (Form 1040, line 16).
 *
 * Preferential income (qualified dividends + eligible net capital gain) stacks on
 * top of ordinary taxable income and is taxed at 0% / 15% / 20% depending on where
 * it falls relative to the filing-status rate thresholds. Ordinary income is taxed
 * using the tax table / tax computation worksheet. Final tax is the smaller of the
 * worksheet result and the ordinary tax on all taxable income.
 */
export function computeQualifiedDividendsTax(
  input: QualifiedDividendsInput,
  graph: CalculationGraph,
): QualifiedDividendsResult {
  const { filingStatus } = input
  const taxableIncome = money.roundIRS(input.taxableIncome)
  const qualifiedDividends = money.roundIRS(input.qualifiedDividends)
  const capitalGain = money.roundIRS(input.eligibleNetCapitalGain)

  const preferentialIncome = money.min(
    taxableIncome,
    money.add(qualifiedDividends, capitalGain),
  )
  const ordinaryPortion = money.max(
    money.zero,
    money.subtract(taxableIncome, preferentialIncome),
  )

  const { rate15Starts, rate20Starts } = QD_THRESHOLDS[filingStatus]

  // Amount of preferential income taxed at 0%: fills the gap between ordinary
  // income and the top of the 0% bracket.
  const zeroRoom = money.max(money.zero, money.subtract(rate15Starts, ordinaryPortion))
  const taxedAt0 = money.min(preferentialIncome, zeroRoom)

  const remainingAfter0 = money.subtract(preferentialIncome, taxedAt0)

  // Amount taxed at 15%: preferential income between the 0% top and the 15% top.
  const lower15 = money.max(ordinaryPortion, rate15Starts)
  const upper15 = money.min(taxableIncome, rate20Starts)
  const room15 = money.max(money.zero, money.subtract(upper15, lower15))
  const taxedAt15 = money.min(remainingAfter0, room15)

  const taxedAt20 = money.subtract(remainingAfter0, taxedAt15)

  const ordinaryTax = computeOrdinaryTax(ordinaryPortion, filingStatus).tax
  const taxAt15 = money.roundNearestCent(taxedAt15 * 0.15)
  const taxAt20 = money.roundNearestCent(taxedAt20 * 0.2)

  const worksheetTax = money.roundIRS(
    money.add(ordinaryTax, taxAt15, taxAt20),
  )
  const fullOrdinaryTax = computeOrdinaryTax(taxableIncome, filingStatus).tax
  const tax = money.min(worksheetTax, fullOrdinaryTax)

  const taxNodeId = 'form1040:line16'
  addNode(graph, {
    id: taxNodeId,
    label: 'Tax (Qualified Dividends & Capital Gain Worksheet)',
    value: tax,
    kind: 'worksheet',
    inputs: [],
    destination: { form: 'Form 1040', line: '16' },
    rule: 'Preferential income taxed at 0/15/20%; ordinary income via tax table; final tax is the smaller of worksheet vs. ordinary tax on all income',
    sourceAuthority: SOURCE_QD_BRACKETS,
    children: [
      { label: 'Ordinary income portion', value: ordinaryPortion },
      { label: 'Tax on ordinary portion', value: ordinaryTax },
      { label: 'Preferential income', value: preferentialIncome },
      { label: 'Taxed at 0%', value: taxedAt0 },
      { label: 'Taxed at 15%', value: taxedAt15 },
      { label: 'Tax at 15%', value: taxAt15 },
      { label: 'Taxed at 20%', value: taxedAt20 },
      { label: 'Tax at 20%', value: taxAt20 },
      { label: 'Tax on all income (ordinary)', value: fullOrdinaryTax },
    ],
  })

  return {
    tax,
    ordinaryPortion,
    preferentialIncome,
    taxedAt0,
    taxedAt15,
    taxedAt20,
    taxAt15,
    taxAt20,
    ordinaryTax,
    taxNodeId,
  }
}
