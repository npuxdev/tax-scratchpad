import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { computeOrdinaryTax } from '../../tax/2025/ordinary-tax'
import type { FilingStatus } from '../../tax/types'

describe('computeOrdinaryTax', () => {
  it('matches the IRS tax table for MFJ $25,300 → $2,562', () => {
    const result = computeOrdinaryTax(money.fromDollars(25_300), 'married_joint')
    expect(result.method).toBe('tax-table')
    expect(result.tax).toBe(money.fromDollars(2_562))
  })

  it('uses the tax table just under $100,000 and the worksheet at $100,000', () => {
    const under = computeOrdinaryTax(money.fromDollars(99_999), 'married_joint')
    const at = computeOrdinaryTax(money.fromDollars(100_000), 'married_joint')

    expect(under.method).toBe('tax-table')
    expect(under.tax).toBe(money.fromDollars(11_823))

    expect(at.method).toBe('computation-worksheet')
    expect(at.tax).toBe(money.fromDollars(11_828))

    // Both approaches should agree closely at the boundary.
    expect(at.tax).toBeGreaterThan(under.tax)
  })

  it('produces a positive tax for each filing status (smoke)', () => {
    const statuses: FilingStatus[] = [
      'single',
      'married_joint',
      'married_separate',
      'head_of_household',
    ]
    for (const status of statuses) {
      const result = computeOrdinaryTax(money.fromDollars(60_000), status)
      expect(result.tax).toBeGreaterThan(0)
    }
  })

  it('returns zero tax for negative taxable income', () => {
    expect(computeOrdinaryTax(money.fromDollars(-100), 'single').tax).toBe(0)
  })
})
