import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { createGraph } from '../../tax/graph'
import { createFormInstance } from '../../state/scenario'
import { computeScheduleA } from '../../tax/2025/schedule-a'

describe('computeScheduleA', () => {
  it('applies the 7.5% AGI medical floor', () => {
    const form = createFormInstance('SCHEDULE_A')
    form.values.medical = money.fromDollars(10_000)
    const agi = money.fromDollars(100_000)
    const result = computeScheduleA(form, agi, 'single', createGraph())
    // floor = 7.5% * 100,000 = 7,500 → deductible = 2,500
    expect(result.medicalDeductible).toBe(money.fromDollars(2_500))
  })

  it('caps SALT at the $40,000 default cap', () => {
    const form = createFormInstance('SCHEDULE_A')
    form.values.stateLocalIncomeTax = money.fromDollars(30_000)
    form.values.realEstateTax = money.fromDollars(20_000)
    const agi = money.fromDollars(120_000)
    const result = computeScheduleA(form, agi, 'married_joint', createGraph())
    expect(result.saltRaw).toBe(money.fromDollars(50_000))
    expect(result.saltDeductible).toBe(money.fromDollars(40_000))
  })

  it('phases the SALT cap down toward the $10,000 floor', () => {
    const form = createFormInstance('SCHEDULE_A')
    form.values.stateLocalIncomeTax = money.fromDollars(40_000)
    const agi = money.fromDollars(600_000) // $100k over the $500k threshold
    const result = computeScheduleA(form, agi, 'single', createGraph())
    // phase-down = 30% * 100,000 = 30,000 → cap = 40,000 - 30,000 = 10,000 (== floor)
    expect(result.saltCap).toBe(money.fromDollars(10_000))
    expect(result.saltDeductible).toBe(money.fromDollars(10_000))
  })

  it('uses the MFS $20,000 SALT cap', () => {
    const form = createFormInstance('SCHEDULE_A')
    form.values.stateLocalIncomeTax = money.fromDollars(30_000)
    const agi = money.fromDollars(100_000)
    const result = computeScheduleA(form, agi, 'married_separate', createGraph())
    expect(result.saltDeductible).toBe(money.fromDollars(20_000))
  })

  it('totals medical, SALT, mortgage, and charitable', () => {
    const form = createFormInstance('SCHEDULE_A')
    form.values.stateLocalIncomeTax = money.fromDollars(5_000)
    form.values.mortgageInterest = money.fromDollars(12_000)
    form.values.charitableCash = money.fromDollars(3_000)
    const agi = money.fromDollars(100_000)
    const result = computeScheduleA(form, agi, 'single', createGraph())
    // medical 0, salt 5,000, mortgage 12,000, charitable 3,000
    expect(result.total).toBe(money.fromDollars(20_000))
  })
})
