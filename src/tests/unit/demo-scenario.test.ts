import { describe, expect, it } from 'vitest'
import { calculateFederal2025 } from '../../tax/2025/calculate'
import { buildPacket } from '../../app/packet'
import {
  createDemoScenario,
  DEMO_SCENARIO_NAME,
  expectedW2Fica,
} from '../../fixtures/demo-scenario'
import { money } from '../../tax/money'

describe('createDemoScenario', () => {
  const scenario = createDemoScenario()
  const result = calculateFederal2025(scenario)
  const packet = buildPacket(scenario, result)

  it('is a fictional Baseline scenario with exact coverage', () => {
    expect(scenario.name).toBe(DEMO_SCENARIO_NAME)
    expect(result.coverage.status).toBe('exact')
    expect(result.coverage.issues).toHaveLength(0)
  })

  it('includes W-2, 1099-INT, Schedule C, and 1099-NEC', () => {
    expect(scenario.forms.map((form) => form.type)).toEqual([
      'W2',
      '1099_INT',
      '1099_NEC',
      'SCHEDULE_C',
    ])
  })

  it('uses internally consistent fictional W-2 wages and FICA', () => {
    const w2 = scenario.forms.find((form) => form.type === 'W2')
    expect(w2).toBeDefined()
    const wages = w2!.values.box1
    expect(typeof wages).toBe('number')
    expect(wages).toBeGreaterThan(0)
    expect(w2!.values.box3).toBe(wages)
    expect(w2!.values.box5).toBe(wages)
    const fica = expectedW2Fica(wages as number)
    expect(w2!.values.box4).toBe(fica.ssTax)
    expect(w2!.values.box6).toBe(fica.medicareTax)
    expect(w2!.values.box2).toBe(money.fromDollars(7_150))
  })

  it('links the 1099-NEC to Schedule C', () => {
    const scheduleC = scenario.forms.find((form) => form.type === 'SCHEDULE_C')
    const nec = scenario.forms.find((form) => form.type === '1099_NEC')
    expect(nec?.relationships?.scheduleCId).toBe(scheduleC?.id)
  })

  it('exposes Form 1040, Schedule 1, Schedule 2, and Schedule SE', () => {
    const labels = packet.calculated.map((item) => item.label)
    expect(labels).toEqual(
      expect.arrayContaining([
        'Form 1040',
        'Schedule 1',
        'Schedule 2',
        'Schedule SE',
      ]),
    )
  })

  it('does not embed SSNs, street addresses, or obviously real identity data', () => {
    const blob = JSON.stringify(scenario)
    expect(blob).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/)
    expect(blob).not.toMatch(/\b\d{9}\b/)
    expect(blob.toLowerCase()).not.toMatch(
      /\b(ssn|social security number)\s*[:=]\s*["']?\d/,
    )
    expect(scenario.basics.taxpayerName).toBe('Morgan Ellis')
    expect(scenario.basics.spouseName).toBe('Quinn Ellis')
    expect(blob.toLowerCase()).not.toMatch(/\d+\s+(main|oak|elm|maple)\s+(st|street|ave|avenue)/)
  })

  it('produces a complete projection with self-employment tax', () => {
    expect(result.totals.income).toBeGreaterThan(0)
    expect(result.totals.selfEmploymentTax).toBeGreaterThan(0)
    expect(result.totals.totalTax).toBeGreaterThan(0)
    expect(Number.isFinite(result.totals.refundOrDue)).toBe(true)
  })
})
