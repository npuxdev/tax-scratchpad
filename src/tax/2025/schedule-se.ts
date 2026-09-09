import type { CalculationGraph, Cents } from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import {
  SE_NET_EARNINGS_FACTOR,
  SE_RATE_MEDICARE,
  SE_RATE_SS,
  SE_TAX_THRESHOLD,
  SOURCE_SE_TAX,
  SOURCE_SS_WAGE_BASE,
  SS_WAGE_BASE,
} from './constants'

export interface ScheduleSEResult {
  netProfit: Cents
  /** Net earnings from self-employment (net profit × 0.9235). */
  netEarnings: Cents
  socialSecurityTax: Cents
  medicareTax: Cents
  seTax: Cents
  /** Deductible half of SE tax → Schedule 1 adjustment. */
  deductibleHalf: Cents
  seTaxNodeId: string
  deductionNodeId: string
}

/**
 * Compute nonfarm self-employment tax (Schedule SE).
 *
 * `combinedNetProfit` is the sum of all Schedule C net profits (losses already
 * offset). `w2SocialSecurityWages` is total W-2 box 3 which consumes the Social
 * Security wage base before SE earnings are taxed for the 12.4% portion.
 */
export function computeScheduleSE(
  combinedNetProfit: Cents,
  w2SocialSecurityWages: Cents,
  graph: CalculationGraph,
): ScheduleSEResult {
  const seTaxNodeId = 'scheduleSE:tax'
  const deductionNodeId = 'scheduleSE:deduction'

  if (combinedNetProfit <= 0) {
    addNode(graph, {
      id: seTaxNodeId,
      label: 'Self-employment tax',
      value: money.zero,
      kind: 'derived',
      inputs: [],
      destination: { form: 'Schedule 2', line: '4' },
      rule: 'No self-employment tax: combined net profit is zero or a loss',
      sourceAuthority: SOURCE_SE_TAX,
    })
    addNode(graph, {
      id: deductionNodeId,
      label: 'Deductible part of SE tax',
      value: money.zero,
      kind: 'derived',
      inputs: [seTaxNodeId],
      destination: { form: 'Schedule 1', line: '15' },
    })
    return {
      netProfit: combinedNetProfit,
      netEarnings: money.zero,
      socialSecurityTax: money.zero,
      medicareTax: money.zero,
      seTax: money.zero,
      deductibleHalf: money.zero,
      seTaxNodeId,
      deductionNodeId,
    }
  }

  const netEarnings = money.roundNearestCent(
    combinedNetProfit * SE_NET_EARNINGS_FACTOR,
  )

  // Under $400 of net earnings → no SE tax.
  if (netEarnings < SE_TAX_THRESHOLD) {
    addNode(graph, {
      id: seTaxNodeId,
      label: 'Self-employment tax',
      value: money.zero,
      kind: 'derived',
      inputs: [],
      destination: { form: 'Schedule 2', line: '4' },
      rule: 'Net earnings below $400 threshold → no SE tax',
      sourceAuthority: SOURCE_SE_TAX,
    })
    addNode(graph, {
      id: deductionNodeId,
      label: 'Deductible part of SE tax',
      value: money.zero,
      kind: 'derived',
      inputs: [seTaxNodeId],
      destination: { form: 'Schedule 1', line: '15' },
    })
    return {
      netProfit: combinedNetProfit,
      netEarnings,
      socialSecurityTax: money.zero,
      medicareTax: money.zero,
      seTax: money.zero,
      deductibleHalf: money.zero,
      seTaxNodeId,
      deductionNodeId,
    }
  }

  const ssBaseRemaining = money.max(
    money.zero,
    money.subtract(SS_WAGE_BASE, w2SocialSecurityWages),
  )
  const ssTaxable = money.min(netEarnings, ssBaseRemaining)
  const socialSecurityTax = money.roundNearestCent(ssTaxable * SE_RATE_SS)
  const medicareTax = money.roundNearestCent(netEarnings * SE_RATE_MEDICARE)
  const seTax = money.add(socialSecurityTax, medicareTax)
  const deductibleHalf = money.roundNearestCent(seTax / 2)

  addNode(graph, {
    id: 'scheduleSE:netEarnings',
    label: 'Net earnings from self-employment',
    value: netEarnings,
    kind: 'percentage',
    inputs: [],
    destination: { form: 'Schedule SE', line: '4a' },
    rule: `Net earnings = net profit × ${SE_NET_EARNINGS_FACTOR}`,
    sourceAuthority: SOURCE_SE_TAX,
    children: [{ label: 'Combined net profit', value: combinedNetProfit }],
  })

  addNode(graph, {
    id: seTaxNodeId,
    label: 'Self-employment tax',
    value: seTax,
    kind: 'sum',
    inputs: ['scheduleSE:netEarnings'],
    destination: { form: 'Schedule 2', line: '4' },
    rule: `SS 12.4% on lesser of net earnings or remaining wage base ($${
      SS_WAGE_BASE / 100
    } − W-2 SS wages); Medicare 2.9% on all net earnings`,
    sourceAuthority: SOURCE_SS_WAGE_BASE,
    children: [
      { label: 'Social Security portion (12.4%)', value: socialSecurityTax },
      { label: 'Medicare portion (2.9%)', value: medicareTax },
    ],
  })

  addNode(graph, {
    id: deductionNodeId,
    label: 'Deductible part of SE tax',
    value: deductibleHalf,
    kind: 'percentage',
    inputs: [seTaxNodeId],
    destination: { form: 'Schedule 1', line: '15' },
    rule: 'One-half of self-employment tax',
    sourceAuthority: SOURCE_SE_TAX,
  })

  return {
    netProfit: combinedNetProfit,
    netEarnings,
    socialSecurityTax,
    medicareTax,
    seTax,
    deductibleHalf,
    seTaxNodeId,
    deductionNodeId,
  }
}
