import { describe, it, expect } from 'vitest'
import { calculateFederal2025 } from '../../tax/2025/calculate'
import { createExampleReturn, EXPECTED_EXAMPLE_RETURN } from '../../fixtures/example-return'

describe('calculateFederal2025 — example MFJ return', () => {
  const result = calculateFederal2025(createExampleReturn())

  it('has exact coverage', () => {
    expect(result.coverage.status).toBe('exact')
    expect(result.coverage.issues).toHaveLength(0)
  })

  it('computes income and taxable income', () => {
    expect(result.totals.income).toBe(EXPECTED_EXAMPLE_RETURN.income)
    expect(result.totals.deductions).toBe(EXPECTED_EXAMPLE_RETURN.standardDeduction)
    expect(result.totals.deductionType).toBe('standard')
    expect(result.totals.taxableIncome).toBe(EXPECTED_EXAMPLE_RETURN.taxableIncome)
  })

  it('computes tax of $2,562 via the tax table', () => {
    expect(result.totals.incomeTax).toBe(EXPECTED_EXAMPLE_RETURN.tax)
    expect(result.totals.totalTax).toBe(EXPECTED_EXAMPLE_RETURN.tax)
  })

  it('produces a refund of $438', () => {
    expect(result.totals.withholding).toBe(EXPECTED_EXAMPLE_RETURN.withholding)
    expect(result.totals.refundOrDue).toBe(EXPECTED_EXAMPLE_RETURN.refund)
  })

  it('has no self-employment or additional medicare tax', () => {
    expect(result.totals.selfEmploymentTax).toBe(0)
    expect(result.totals.additionalMedicareTax).toBe(0)
  })
})
