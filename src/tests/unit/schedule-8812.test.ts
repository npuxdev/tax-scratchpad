import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { createGraph } from '../../tax/graph'
import { computeSchedule8812 } from '../../tax/2025/schedule-8812'
import type { Dependent } from '../../tax/types'

function child(age: number, overrides: Partial<Dependent> = {}): Dependent {
  return {
    id: `dep-${Math.random()}`,
    relationship: 'daughter',
    ageAtEndOf2025: age,
    livedWithTaxpayerMoreThanHalfYear: true,
    providedMoreThanHalfOwnSupport: false,
    claimedAsDependent: true,
    citizenNationalOrResidentAlien: true,
    validEmploymentSSN: true,
    ...overrides,
  }
}

describe('computeSchedule8812', () => {
  it('grants a $2,200 CTC for a qualifying child under 17', () => {
    const result = computeSchedule8812(
      {
        dependents: [child(5)],
        filingStatus: 'married_joint',
        agi: money.fromDollars(80_000),
        taxLiability: money.fromDollars(10_000),
        earnedIncome: money.fromDollars(80_000),
        socialSecurityAndMedicareTaxes: 0,
      },
      createGraph(),
    )
    expect(result.qualifyingChildren).toBe(1)
    expect(result.creditBeforePhaseout).toBe(money.fromDollars(2_200))
    expect(result.nonrefundableCredit).toBe(money.fromDollars(2_200))
  })

  it('treats a 17-year-old as an other dependent ($500 ODC)', () => {
    const result = computeSchedule8812(
      {
        dependents: [child(17)],
        filingStatus: 'married_joint',
        agi: money.fromDollars(80_000),
        taxLiability: money.fromDollars(10_000),
        earnedIncome: money.fromDollars(80_000),
        socialSecurityAndMedicareTaxes: 0,
      },
      createGraph(),
    )
    expect(result.qualifyingChildren).toBe(0)
    expect(result.otherDependents).toBe(1)
    expect(result.creditBeforePhaseout).toBe(money.fromDollars(500))
  })

  it('phases out the credit by 5% of MAGI over the threshold', () => {
    const result = computeSchedule8812(
      {
        dependents: [child(5)],
        filingStatus: 'married_joint',
        agi: money.fromDollars(410_000), // $10,000 over the $400,000 MFJ threshold
        taxLiability: money.fromDollars(50_000),
        earnedIncome: money.fromDollars(410_000),
        socialSecurityAndMedicareTaxes: 0,
      },
      createGraph(),
    )
    // reduction = 5% * 10,000 = 500 → 2,200 - 500 = 1,700
    expect(result.phaseoutReduction).toBe(money.fromDollars(500))
    expect(result.creditAfterPhaseout).toBe(money.fromDollars(1_700))
  })

  it('computes the refundable ACTC when tax is zero', () => {
    const result = computeSchedule8812(
      {
        dependents: [child(5)],
        filingStatus: 'married_joint',
        agi: money.fromDollars(30_000),
        taxLiability: 0,
        earnedIncome: money.fromDollars(30_000),
        socialSecurityAndMedicareTaxes: 0,
      },
      createGraph(),
    )
    // No tax to absorb the credit → refundable ACTC capped at $1,700/child.
    expect(result.nonrefundableCredit).toBe(0)
    expect(result.additionalChildTaxCredit).toBe(money.fromDollars(1_700))
  })

  it('uses the SS/Medicare tax path for 3+ qualifying children', () => {
    const result = computeSchedule8812(
      {
        dependents: [child(3), child(5), child(7)],
        filingStatus: 'married_joint',
        agi: money.fromDollars(20_000),
        taxLiability: 0,
        earnedIncome: money.fromDollars(10_000), // 15% of (10,000 - 2,500) = 1,125
        socialSecurityAndMedicareTaxes: money.fromDollars(4_000),
      },
      createGraph(),
    )
    // Larger of earned-income formula ($1,125) or SS/Medicare taxes ($4,000),
    // capped at $1,700/child * 3 = $5,100 and remaining credit $6,600.
    expect(result.additionalChildTaxCredit).toBe(money.fromDollars(4_000))
  })
})
