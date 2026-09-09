import { describe, it, expect } from 'vitest'
import {
  compareScenarios,
  comparisonDownloadName,
  exportComparisonJson,
  formatComparisonValue,
  formatOutcomeDelta,
} from '../../comparison/compare'
import { createExampleReturn } from '../../fixtures/example-return'
import { createEmptyScenario, createFormInstance, duplicateScenario } from '../../state/scenario'
import { money } from '../../tax/money'
import type { TaxScenario } from '../../tax/types'

const COMPARED_AT = '2026-09-09T16:00:00.000Z'

function withWages(scenario: TaxScenario, wages: number): TaxScenario {
  const forms = scenario.forms.map((form) => {
    if (form.type !== 'W2') return form
    return {
      ...form,
      values: {
        ...form.values,
        box1: wages,
        box3: wages,
        box5: wages,
      },
    }
  })
  return { ...scenario, forms }
}

describe('compareScenarios', () => {
  it('requires at least two scenarios', () => {
    expect(() => compareScenarios([createExampleReturn()])).toThrow(
      /at least 2 scenarios/,
    )
  })

  it('reports identical copies as matching', () => {
    const a = createExampleReturn()
    const b = duplicateScenario(a)
    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })

    expect(comparison.kind).toBe('scenario-comparison')
    expect(comparison.summary.identical).toBe(true)
    expect(comparison.calculations).toHaveLength(0)
    expect(comparison.inputs).toHaveLength(0)
    expect(comparison.scenarios).toHaveLength(2)
    expect(comparison.scenarios[0]?.totals.refundOrDue).toBe(
      comparison.scenarios[1]?.totals.refundOrDue,
    )
  })

  it('calls out wage and refund differences between copies', () => {
    const baseline = createExampleReturn()
    const raised = withWages(duplicateScenario(baseline), money.fromDollars(80_000))
    const comparison = compareScenarios([baseline, raised], {
      comparedAt: COMPARED_AT,
    })

    expect(comparison.summary.identical).toBe(false)
    expect(comparison.summary.inputCount).toBeGreaterThan(0)
    expect(comparison.summary.calculationCount).toBeGreaterThan(0)

    const wage = comparison.inputs.find((row) => row.id.endsWith('.box1'))
    expect(wage).toBeDefined()
    expect(wage?.values).toEqual([
      money.fromDollars(56_800),
      money.fromDollars(80_000),
    ])

    const refund = comparison.calculations.find(
      (row) => row.id === 'totals.refundOrDue',
    )
    expect(refund).toBeDefined()
    expect(refund?.values[0]).not.toBe(refund?.values[1])

    const income = comparison.calculations.find((row) => row.id === 'totals.income')
    expect(income?.values).toEqual([
      money.fromDollars(56_800),
      money.fromDollars(80_000),
    ])
  })

  it('matches forms by employer name even when ids and order differ', () => {
    const acme = createFormInstance('W2', 'W-2')
    acme.values.employerName = 'Acme'
    acme.values.box1 = money.fromDollars(10_000)

    const beta = createFormInstance('W2', 'W-2')
    beta.values.employerName = 'Beta'
    beta.values.box1 = money.fromDollars(20_000)

    const a = createEmptyScenario('A', 'single')
    a.forms = [acme, beta]

    const betaCopy = createFormInstance('W2', 'W-2')
    betaCopy.values.employerName = 'Beta'
    betaCopy.values.box1 = money.fromDollars(25_000)

    const acmeCopy = createFormInstance('W2', 'W-2')
    acmeCopy.values.employerName = 'Acme'
    acmeCopy.values.box1 = money.fromDollars(10_000)

    const b = createEmptyScenario('B', 'single')
    b.forms = [betaCopy, acmeCopy]

    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })
    const wageRows = comparison.inputs.filter((row) => row.id.endsWith('.box1'))

    expect(wageRows).toHaveLength(1)
    expect(wageRows[0]?.group).toContain('Beta')
    expect(wageRows[0]?.values).toEqual([
      money.fromDollars(20_000),
      money.fromDollars(25_000),
    ])
    expect(
      comparison.inputs.some(
        (row) => row.group.includes('Acme') && row.id.endsWith('.box1'),
      ),
    ).toBe(false)
  })

  it('marks a form that exists in only one scenario', () => {
    const a = createExampleReturn()
    const b = duplicateScenario(a)
    const extra = createFormInstance('1099_INT', '1099-INT')
    extra.values.payerName = 'City Bank'
    extra.values.box1 = money.fromDollars(500)
    b.forms = [...b.forms, extra]

    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })
    const presence = comparison.inputs.find((row) => row.kind === 'presence')

    expect(presence?.label).toContain('City Bank')
    expect(presence?.values).toEqual(['absent', 'present'])

    const interest = comparison.inputs.find(
      (row) => row.group.includes('City Bank') && row.id.endsWith('.box1'),
    )
    expect(interest?.values).toEqual([null, money.fromDollars(500)])
  })

  it('matches dependents by name across scenarios', () => {
    const a = createEmptyScenario('A', 'head_of_household')
    const b = createEmptyScenario('B', 'head_of_household')
    a.dependents = [
      {
        id: 'dep-a',
        name: 'Sam Kid',
        relationship: 'child',
        ageAtEndOf2025: 8,
        livedWithTaxpayerMoreThanHalfYear: true,
        providedMoreThanHalfOwnSupport: false,
        claimedAsDependent: true,
        citizenNationalOrResidentAlien: true,
        validEmploymentSSN: true,
      },
    ]
    b.dependents = [
      {
        id: 'dep-b',
        name: 'Sam Kid',
        relationship: 'child',
        ageAtEndOf2025: 12,
        livedWithTaxpayerMoreThanHalfYear: true,
        providedMoreThanHalfOwnSupport: false,
        claimedAsDependent: true,
        citizenNationalOrResidentAlien: true,
        validEmploymentSSN: true,
      },
    ]

    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })
    const age = comparison.inputs.find((row) => row.id.endsWith('.ageAtEndOf2025'))
    expect(age?.group).toBe('Sam Kid')
    expect(age?.values).toEqual([8, 12])
  })

  it('exports a JSON document of the comparison used in the view', () => {
    const a = createExampleReturn()
    const b = withWages(duplicateScenario(a), money.fromDollars(70_000))
    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })
    const parsed = JSON.parse(exportComparisonJson(comparison)) as {
      kind: string
      comparedAt: string
      scenarios: unknown[]
      calculations: unknown[]
      inputs: unknown[]
      summary: { identical: boolean }
    }

    expect(parsed.kind).toBe('scenario-comparison')
    expect(parsed.comparedAt).toBe(COMPARED_AT)
    expect(parsed.scenarios).toHaveLength(2)
    expect(parsed.summary.identical).toBe(false)
    expect(parsed.calculations.length).toBe(comparison.calculations.length)
    expect(parsed.inputs.length).toBe(comparison.inputs.length)
    expect(comparisonDownloadName(comparison)).toMatch(/comparison-.*-vs-.*\.json/)
  })

  it('formats refund rows with a signed amount', () => {
    const a = createExampleReturn()
    const b = withWages(duplicateScenario(a), money.fromDollars(80_000))
    const comparison = compareScenarios([a, b], { comparedAt: COMPARED_AT })
    const refund = comparison.calculations.find(
      (row) => row.id === 'totals.refundOrDue',
    )
    expect(refund).toBeDefined()
    const formatted = formatComparisonValue(refund!, 0)
    expect(formatted.startsWith('+') || formatted.startsWith('-') || formatted.startsWith('$')).toBe(
      true,
    )
  })
})

describe('formatOutcomeDelta', () => {
  it('describes less due, more due, larger refund, and smaller refund', () => {
    expect(formatOutcomeDelta(money.fromDollars(-1000), money.fromDollars(-745))).toBe(
      '$255 less due',
    )
    expect(formatOutcomeDelta(money.fromDollars(-500), money.fromDollars(-680))).toBe(
      '$180 more due',
    )
    expect(formatOutcomeDelta(money.fromDollars(1000), money.fromDollars(1420))).toBe(
      '$420 larger refund',
    )
    expect(formatOutcomeDelta(money.fromDollars(1000), money.fromDollars(580))).toBe(
      '$420 smaller refund',
    )
  })

  it('describes sign changes against baseline', () => {
    expect(formatOutcomeDelta(money.fromDollars(-200), money.fromDollars(150))).toBe(
      'now a $150 refund',
    )
    expect(formatOutcomeDelta(money.fromDollars(200), money.fromDollars(-150))).toBe(
      'now $150 due',
    )
    expect(formatOutcomeDelta(money.fromDollars(-200), 0)).toBe('now $0')
  })

  it('returns null when amounts match', () => {
    expect(formatOutcomeDelta(100, 100)).toBeNull()
  })
})
