import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { createEmptyScenario, createFormInstance } from '../../state/scenario'
import { scanCoverage } from '../../tax/2025/coverage'

describe('scanCoverage', () => {
  it('marks a plain W-2 return as exact', () => {
    const scenario = createEmptyScenario('Clean', 'single')
    const w2 = createFormInstance('W2')
    w2.values.box1 = money.fromDollars(50_000)
    w2.values.box2 = money.fromDollars(5_000)
    scenario.forms = [w2]
    expect(scanCoverage(scenario).status).toBe('exact')
  })

  it('flags an unsupported-trigger field with a meaningful value', () => {
    const scenario = createEmptyScenario('Dep care', 'single')
    const w2 = createFormInstance('W2')
    w2.values.box1 = money.fromDollars(50_000)
    w2.values.box10 = money.fromDollars(2_000) // dependent care benefits
    scenario.forms = [w2]
    const result = scanCoverage(scenario)
    expect(result.status).toBe('unsupported')
    expect(result.issues.some((i) => i.fieldId === 'box10')).toBe(true)
  })

  it('flags age 65+ as unsupported', () => {
    const scenario = createEmptyScenario('Senior', 'single')
    scenario.basics.taxpayerAgeAtEndOfYear = 66
    expect(scanCoverage(scenario).status).toBe('unsupported')
  })

  it('flags blindness as unsupported', () => {
    const scenario = createEmptyScenario('Blind', 'single')
    scenario.basics.taxpayerBlind = true
    expect(scanCoverage(scenario).status).toBe('unsupported')
  })

  it('flags qualified dividends greater than ordinary dividends as needs-input', () => {
    const scenario = createEmptyScenario('Bad DIV', 'single')
    const div = createFormInstance('1099_DIV')
    div.values.box1a = money.fromDollars(1_000)
    div.values.box1b = money.fromDollars(1_500)
    scenario.forms = [div]
    const result = scanCoverage(scenario)
    expect(result.status).toBe('needs-input')
    expect(result.issues.some((i) => i.id.includes('qd-gt-ordinary'))).toBe(true)
  })

  it('does not flag Schedule C depreciation / home office when false', () => {
    const scenario = createEmptyScenario('SchedC', 'single')
    const c = createFormInstance('SCHEDULE_C')
    c.values.otherGrossReceipts = money.fromDollars(20_000)
    scenario.forms = [c]
    expect(scanCoverage(scenario).status).toBe('exact')
  })

  it('flags Schedule C depreciation when enabled', () => {
    const scenario = createEmptyScenario('SchedC depr', 'single')
    const c = createFormInstance('SCHEDULE_C')
    c.values.hasDepreciation = true
    scenario.forms = [c]
    expect(scanCoverage(scenario).status).toBe('unsupported')
  })
})
