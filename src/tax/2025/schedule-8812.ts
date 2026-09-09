import type {
  CalculationGraph,
  Cents,
  Dependent,
  FilingStatus,
} from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import {
  ACTC_EARNED_INCOME_FLOOR,
  ACTC_MAX,
  CTC_MAX,
  CTC_PHASEOUT_MFJ,
  CTC_PHASEOUT_OTHER,
  ODC_MAX,
  SOURCE_CTC,
} from './constants'

export interface Schedule8812Input {
  dependents: Dependent[]
  filingStatus: FilingStatus
  agi: Cents
  /** Tax available to absorb the nonrefundable credit (Form 1040 line 18). */
  taxLiability: Cents
  /** Earned income for the ACTC formula (wages + net SE earnings). */
  earnedIncome: Cents
  /** Social Security + Medicare taxes for the 3+ children ACTC alternative. */
  socialSecurityAndMedicareTaxes: Cents
}

export interface Schedule8812Result {
  qualifyingChildren: number
  otherDependents: number
  creditBeforePhaseout: Cents
  phaseoutReduction: Cents
  creditAfterPhaseout: Cents
  /** Nonrefundable CTC + ODC applied against tax (Form 1040 line 19). */
  nonrefundableCredit: Cents
  /** Refundable Additional Child Tax Credit (Form 1040 line 28). */
  additionalChildTaxCredit: Cents
  nonrefundableNodeId: string
  refundableNodeId: string
}

/** A qualifying child for the Child Tax Credit must be under 17 at year end. */
export function isCtcQualifyingChild(dep: Dependent): boolean {
  return (
    dep.claimedAsDependent &&
    dep.ageAtEndOf2025 < 17 &&
    dep.livedWithTaxpayerMoreThanHalfYear &&
    !dep.providedMoreThanHalfOwnSupport &&
    dep.citizenNationalOrResidentAlien &&
    dep.validEmploymentSSN
  )
}

/** A claimed dependent who is not a CTC qualifying child qualifies for the ODC. */
export function isOtherDependent(dep: Dependent): boolean {
  return (
    dep.claimedAsDependent &&
    dep.citizenNationalOrResidentAlien &&
    !isCtcQualifyingChild(dep)
  )
}

export function computeSchedule8812(
  input: Schedule8812Input,
  graph: CalculationGraph,
): Schedule8812Result {
  const {
    dependents,
    filingStatus,
    agi,
    taxLiability,
    earnedIncome,
    socialSecurityAndMedicareTaxes,
  } = input

  const qualifyingChildren = dependents.filter(isCtcQualifyingChild).length
  const otherDependents = dependents.filter(isOtherDependent).length

  const nonrefundableNodeId = 'schedule8812:nonrefundable'
  const refundableNodeId = 'schedule8812:actc'

  const creditBeforePhaseout = money.add(
    qualifyingChildren * CTC_MAX,
    otherDependents * ODC_MAX,
  )

  // Phase-out: 5% of MAGI over threshold, MAGI excess rounded UP to next $1,000.
  const threshold =
    filingStatus === 'married_joint' ? CTC_PHASEOUT_MFJ : CTC_PHASEOUT_OTHER
  const excess = money.max(money.zero, money.subtract(agi, threshold))
  const excessRoundedUp = Math.ceil(excess / 100_000) * 100_000 // ceil to $1,000
  const phaseoutReduction = money.multiplyRate(excessRoundedUp, 0.05)
  const creditAfterPhaseout = money.max(
    money.zero,
    money.subtract(creditBeforePhaseout, phaseoutReduction),
  )

  // Nonrefundable portion limited to available tax (Credit Limit Worksheet).
  const nonrefundableCredit = money.min(creditAfterPhaseout, money.max(money.zero, taxLiability))

  // Additional Child Tax Credit (refundable), only for qualifying children.
  const remainingCredit = money.subtract(creditAfterPhaseout, nonrefundableCredit)
  const actcCap = qualifyingChildren * ACTC_MAX // line 16b: $1,700 per child
  const line17 = money.min(remainingCredit, actcCap)

  const earnedIncomeOverFloor = money.max(
    money.zero,
    money.subtract(earnedIncome, ACTC_EARNED_INCOME_FLOOR),
  )
  const earnedIncomeFormula = money.multiplyRate(earnedIncomeOverFloor, 0.15)

  let additionalChildTaxCredit: Cents
  if (qualifyingChildren >= 3) {
    // Part II-B alternative: larger of the earned-income formula or the amount
    // of Social Security/Medicare taxes paid (reduced by any EIC — none here).
    const alternative = money.max(earnedIncomeFormula, socialSecurityAndMedicareTaxes)
    additionalChildTaxCredit = money.min(line17, alternative)
  } else {
    additionalChildTaxCredit = money.min(line17, earnedIncomeFormula)
  }

  addNode(graph, {
    id: nonrefundableNodeId,
    label: 'Child Tax Credit / Credit for Other Dependents (nonrefundable)',
    value: nonrefundableCredit,
    kind: 'credit',
    inputs: [],
    destination: { form: 'Form 1040', line: '19' },
    rule: `$${CTC_MAX / 100}/qualifying child + $${
      ODC_MAX / 100
    }/other dependent, phased out 5% of MAGI over $${
      threshold / 100
    }, limited to tax`,
    sourceAuthority: SOURCE_CTC,
    children: [
      { label: 'Qualifying children', value: qualifyingChildren },
      { label: 'Other dependents', value: otherDependents },
      { label: 'Credit before phase-out', value: creditBeforePhaseout },
      { label: 'Phase-out reduction', value: -phaseoutReduction },
      { label: 'Credit after phase-out', value: creditAfterPhaseout },
    ],
  })

  addNode(graph, {
    id: refundableNodeId,
    label: 'Additional Child Tax Credit (refundable)',
    value: additionalChildTaxCredit,
    kind: 'credit',
    inputs: [nonrefundableNodeId],
    destination: { form: 'Form 1040', line: '28' },
    rule:
      qualifyingChildren >= 3
        ? 'Refundable, capped at $1,700/child; larger of 15% of earned income over $2,500 or SS/Medicare taxes'
        : 'Refundable, capped at $1,700/child; 15% of earned income over $2,500',
    sourceAuthority: SOURCE_CTC,
    children: [
      { label: 'Remaining credit after nonrefundable', value: remainingCredit },
      { label: 'Refundable cap ($1,700/child)', value: actcCap },
      { label: '15% of earned income over $2,500', value: earnedIncomeFormula },
    ],
  })

  return {
    qualifyingChildren,
    otherDependents,
    creditBeforePhaseout,
    phaseoutReduction,
    creditAfterPhaseout,
    nonrefundableCredit,
    additionalChildTaxCredit,
    nonrefundableNodeId,
    refundableNodeId,
  }
}
