import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { createGraph } from '../../tax/graph'
import { computeScheduleSE } from '../../tax/2025/schedule-se'

describe('computeScheduleSE', () => {
  it('computes SE tax on a $50,000 net profit with no W-2 wages', () => {
    const result = computeScheduleSE(money.fromDollars(50_000), 0, createGraph())
    // net earnings = 50,000 * 0.9235 = 46,175
    expect(result.netEarnings).toBe(money.fromDollars(46_175))
    // SS = 46,175 * 12.4% = 5,725.70 ; Medicare = 46,175 * 2.9% = 1,339.075 → 1,339.08
    expect(result.socialSecurityTax).toBe(572_570)
    expect(result.medicareTax).toBe(133_908)
    expect(result.seTax).toBe(706_478)
    expect(result.deductibleHalf).toBe(353_239)
  })

  it('returns no SE tax for a loss', () => {
    const result = computeScheduleSE(money.fromDollars(-1_000), 0, createGraph())
    expect(result.seTax).toBe(0)
    expect(result.deductibleHalf).toBe(0)
  })

  it('returns no SE tax when net earnings are under $400', () => {
    const result = computeScheduleSE(money.fromDollars(400), 0, createGraph())
    // 400 * 0.9235 = 369.40 < 400 → no SE tax
    expect(result.seTax).toBe(0)
  })

  it('stops the Social Security portion once the wage base is consumed by W-2 wages', () => {
    const w2SsWages = money.fromDollars(176_100) // full 2025 wage base
    const result = computeScheduleSE(money.fromDollars(200_000), w2SsWages, createGraph())
    expect(result.socialSecurityTax).toBe(0)
    // Medicare still applies: 200,000 * 0.9235 = 184,700 ; * 2.9% = 5,356.30
    expect(result.netEarnings).toBe(money.fromDollars(184_700))
    expect(result.medicareTax).toBe(535_630)
    expect(result.seTax).toBe(535_630)
  })
})
