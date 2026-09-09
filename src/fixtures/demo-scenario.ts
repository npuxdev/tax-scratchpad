import { money } from '../tax/money'
import type { Cents, TaxScenario } from '../tax/types'
import { createEmptyScenario, createFormInstance } from '../state/scenario'

export const DEMO_SCENARIO_NAME = 'Baseline'

/**
 * Fictional first-run demonstration: W-2 wages, bank interest, and a small
 * Schedule C practice linked to a 1099-NEC. All names and amounts are invented.
 */
export function createDemoScenario(): TaxScenario {
  const scenario = createEmptyScenario(DEMO_SCENARIO_NAME, 'married_joint')
  const wages = money.fromDollars(78_000)
  const withholding = money.fromDollars(7_150)
  const ssTax = money.multiplyRate(wages, 0.062)
  const medicareTax = money.multiplyRate(wages, 0.0145)

  const w2 = createFormInstance('W2', 'North Harbor Analytics')
  w2.values = {
    ...w2.values,
    employerName: 'North Harbor Analytics',
    box1: wages,
    box2: withholding,
    box3: wages,
    box4: ssTax,
    box5: wages,
    box6: medicareTax,
  }

  const interest = createFormInstance('1099_INT', 'Lakeside Credit Union')
  interest.values = {
    ...interest.values,
    payerName: 'Lakeside Credit Union',
    box1: money.fromDollars(340),
    box4: money.zero,
  }

  const scheduleC = createFormInstance('SCHEDULE_C', 'Ellis Studio')
  scheduleC.values = {
    ...scheduleC.values,
    businessName: 'Ellis Studio',
    advertising: money.fromDollars(210),
    office: money.fromDollars(540),
    supplies: money.fromDollars(360),
    utilities: money.fromDollars(180),
  }

  const nec = createFormInstance('1099_NEC', 'Harbor & Pine LLC', {
    scheduleCId: scheduleC.id,
  })
  nec.values = {
    ...nec.values,
    payerName: 'Harbor & Pine LLC',
    box1: money.fromDollars(14_200),
    box4: money.zero,
  }

  return {
    ...scenario,
    forms: [w2, interest, nec, scheduleC],
    basics: {
      ...scenario.basics,
      taxpayerName: 'Morgan Ellis',
      spouseName: 'Quinn Ellis',
      taxpayerAgeAtEndOfYear: 38,
      spouseAgeAtEndOfYear: 37,
    },
  }
}

export const demoScenario: TaxScenario = createDemoScenario()

/** Informational W-2 FICA amounts implied by box 1 wages at statutory rates. */
export function expectedW2Fica(wages: Cents): { ssTax: Cents; medicareTax: Cents } {
  return {
    ssTax: money.multiplyRate(wages, 0.062),
    medicareTax: money.multiplyRate(wages, 0.0145),
  }
}
