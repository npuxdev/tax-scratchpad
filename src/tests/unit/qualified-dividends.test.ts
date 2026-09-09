import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { createGraph } from '../../tax/graph'
import { computeQualifiedDividendsTax } from '../../tax/2025/qualified-dividends'
import { computeOrdinaryTax } from '../../tax/2025/ordinary-tax'

describe('computeQualifiedDividendsTax', () => {
  it('equals ordinary tax when there is no preferential income', () => {
    const ti = money.fromDollars(50_000)
    const result = computeQualifiedDividendsTax(
      {
        taxableIncome: ti,
        qualifiedDividends: 0,
        eligibleNetCapitalGain: 0,
        filingStatus: 'married_joint',
      },
      createGraph(),
    )
    expect(result.tax).toBe(computeOrdinaryTax(ti, 'married_joint').tax)
  })

  it('taxes qualified dividends at 0% when they fall inside the 0% bracket', () => {
    const ti = money.fromDollars(50_000)
    const result = computeQualifiedDividendsTax(
      {
        taxableIncome: ti,
        qualifiedDividends: money.fromDollars(5_000),
        eligibleNetCapitalGain: 0,
        filingStatus: 'married_joint',
      },
      createGraph(),
    )
    // MFJ 0% bracket tops out at $96,700, so all $5,000 is taxed at 0%.
    expect(result.taxedAt0).toBe(money.fromDollars(5_000))
    // Tax should be the ordinary tax on the remaining $45,000 only.
    expect(result.tax).toBe(computeOrdinaryTax(money.fromDollars(45_000), 'married_joint').tax)
    expect(result.tax).toBeLessThan(computeOrdinaryTax(ti, 'married_joint').tax)
  })

  it('taxes capital gains at 15% above the 0% bracket for a single filer', () => {
    const ti = money.fromDollars(100_000)
    const result = computeQualifiedDividendsTax(
      {
        taxableIncome: ti,
        qualifiedDividends: 0,
        eligibleNetCapitalGain: money.fromDollars(10_000),
        filingStatus: 'single',
      },
      createGraph(),
    )
    // Ordinary income $90,000 already exceeds the single 0% top ($48,350),
    // so the whole $10,000 gain is taxed at 15%.
    expect(result.taxedAt15).toBe(money.fromDollars(10_000))
    expect(result.taxAt15).toBe(money.fromDollars(1_500))
    expect(result.tax).toBeLessThan(computeOrdinaryTax(ti, 'single').tax)
  })
})
