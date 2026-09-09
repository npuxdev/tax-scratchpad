import { describe, expect, it } from 'vitest'
import { calculateFederal2025 } from '../../tax/2025/calculate'
import { STANDARD_DEDUCTION } from '../../tax/2025/constants'
import { createEmptyScenario } from '../../state/scenario'

describe('zero-income empty scenario', () => {
  it('shows $0 tax and nothing due for a single return with no income', () => {
    const result = calculateFederal2025(createEmptyScenario('Empty', 'single'))

    expect(result.coverage.status).toBe('exact')
    expect(result.totals.income).toBe(0)
    expect(result.totals.deductions).toBe(STANDARD_DEDUCTION.single)
    expect(result.totals.taxableIncome).toBe(0)
    expect(result.totals.incomeTax).toBe(0)
    expect(result.totals.selfEmploymentTax).toBe(0)
    expect(result.totals.totalTax).toBe(0)
    expect(result.totals.withholding).toBe(0)
    expect(result.totals.refundOrDue).toBe(0)
    expect(result.forms.form1040['16']).toBe(0)
    expect(result.forms.form1040['24']).toBe(0)
    expect(result.forms.form1040['37']).toBe(0)
  })

  it('shows $0 tax for an empty married-filing-jointly return', () => {
    const result = calculateFederal2025(
      createEmptyScenario('Empty joint', 'married_joint'),
    )

    expect(result.coverage.status).toBe('exact')
    expect(result.totals.deductions).toBe(STANDARD_DEDUCTION.married_joint)
    expect(result.totals.taxableIncome).toBe(0)
    expect(result.totals.totalTax).toBe(0)
    expect(result.totals.refundOrDue).toBe(0)
  })
})
