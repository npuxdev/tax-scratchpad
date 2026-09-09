import type { CalculationGraph, Cents, FilingStatus } from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import {
  ADDITIONAL_MEDICARE_RATE,
  ADDITIONAL_MEDICARE_THRESHOLD,
  SOURCE_ADDITIONAL_MEDICARE,
} from './constants'

export interface AdditionalMedicareResult {
  tax: Cents
  wagesExcess: Cents
  seExcess: Cents
  taxOnWages: Cents
  taxOnSE: Cents
  taxNodeId: string
}

/**
 * Form 8959 (simplified): 0.9% Additional Medicare Tax on Medicare wages plus
 * self-employment earnings above the filing-status threshold. The threshold is
 * applied to wages first; the remaining threshold reduces the SE amount.
 */
export function computeAdditionalMedicareTax(
  medicareWages: Cents,
  seNetEarnings: Cents,
  filingStatus: FilingStatus,
  graph: CalculationGraph,
): AdditionalMedicareResult {
  const threshold = ADDITIONAL_MEDICARE_THRESHOLD[filingStatus]

  const wagesExcess = money.max(money.zero, money.subtract(medicareWages, threshold))
  const taxOnWages = money.roundNearestCent(wagesExcess * ADDITIONAL_MEDICARE_RATE)

  const seThreshold = money.max(money.zero, money.subtract(threshold, medicareWages))
  const seExcess = money.max(money.zero, money.subtract(seNetEarnings, seThreshold))
  const taxOnSE = money.roundNearestCent(seExcess * ADDITIONAL_MEDICARE_RATE)

  const tax = money.roundIRS(money.add(taxOnWages, taxOnSE))

  const taxNodeId = 'form8959:additionalMedicare'
  addNode(graph, {
    id: taxNodeId,
    label: 'Additional Medicare Tax',
    value: tax,
    kind: 'derived',
    inputs: [],
    destination: { form: 'Schedule 2', line: '11' },
    rule: `0.9% on Medicare wages + SE earnings over $${
      threshold / 100
    } (threshold applied to wages first)`,
    sourceAuthority: SOURCE_ADDITIONAL_MEDICARE,
    children: [
      { label: 'Medicare wages over threshold', value: wagesExcess },
      { label: 'Tax on wages (0.9%)', value: taxOnWages },
      { label: 'SE earnings over remaining threshold', value: seExcess },
      { label: 'Tax on SE earnings (0.9%)', value: taxOnSE },
    ],
  })

  return { tax, wagesExcess, seExcess, taxOnWages, taxOnSE, taxNodeId }
}
