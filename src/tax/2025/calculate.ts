import { money } from '../money'
import { addNode, createGraph } from '../graph'
import type {
  CalculationGraph,
  Cents,
  DerivedFormValues,
  Federal2025Result,
  Federal2025Totals,
  TaxScenario,
} from '../types'
import { getStandardDeduction } from './constants'
import { scanCoverage } from './coverage'
import { moneyValue, sumFieldAcrossForms } from './form-1040'
import { computeAllScheduleC } from './schedule-c'
import { computeScheduleSE } from './schedule-se'
import { computeScheduleA } from './schedule-a'
import { computeQualifiedDividendsTax } from './qualified-dividends'
import { computeAdditionalMedicareTax } from './additional-medicare'
import { computeSchedule8812 } from './schedule-8812'
import { computeOrdinaryTax } from './ordinary-tax'

function sumNecWithholding(scenario: TaxScenario): Cents {
  let total = 0
  for (const form of scenario.forms) {
    if (form.type === '1099_NEC') total += moneyValue(form.values.box4)
  }
  return total
}

/**
 * Full 2025 federal calculation engine.
 *
 * Coverage is scanned first; the engine still computes a complete result for
 * debugging even when coverage is not `exact`. The UI must gate the displayed
 * refund/balance-due on `coverage.status === 'exact'`.
 */
export function calculateFederal2025(scenario: TaxScenario): Federal2025Result {
  const graph: CalculationGraph = createGraph()
  const { basics } = scenario
  const filingStatus = basics.filingStatus

  const coverage = scanCoverage(scenario)

  // ── Income ────────────────────────────────────────────────────────────────
  const wages = sumFieldAcrossForms(scenario.forms, 'W2', 'box1')
  const interest = sumFieldAcrossForms(scenario.forms, '1099_INT', 'box1')
  const ordinaryDividends = sumFieldAcrossForms(scenario.forms, '1099_DIV', 'box1a')
  const qualifiedDividends = sumFieldAcrossForms(scenario.forms, '1099_DIV', 'box1b')
  const capitalGainDistributions = sumFieldAcrossForms(scenario.forms, '1099_DIV', 'box2a')
  const medicareWages = sumFieldAcrossForms(scenario.forms, 'W2', 'box5')
  const w2SocialSecurityWages = sumFieldAcrossForms(scenario.forms, 'W2', 'box3')

  addNode(graph, {
    id: 'form1040:1a',
    label: 'Wages (W-2 box 1)',
    value: wages,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '1a' },
  })
  addNode(graph, {
    id: 'form1040:2b',
    label: 'Taxable interest',
    value: interest,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '2b' },
  })
  addNode(graph, {
    id: 'form1040:3a',
    label: 'Qualified dividends',
    value: qualifiedDividends,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '3a' },
  })
  addNode(graph, {
    id: 'form1040:3b',
    label: 'Ordinary dividends',
    value: ordinaryDividends,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '3b' },
  })
  addNode(graph, {
    id: 'form1040:7',
    label: 'Capital gain (distributions)',
    value: capitalGainDistributions,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '7' },
  })

  // ── Schedule C / SE ─────────────────────────────────────────────────────────
  const scheduleC = computeAllScheduleC(scenario, graph)
  const se = computeScheduleSE(scheduleC.totalNet, w2SocialSecurityWages, graph)

  // ── Schedule 1 business income → Form 1040 total income ─────────────────────
  const businessIncome = scheduleC.totalNet
  addNode(graph, {
    id: 'schedule1:3',
    label: 'Business income (Schedule C)',
    value: businessIncome,
    kind: 'sum',
    inputs: scheduleC.results.map((r) => r.netProfitNodeId),
    destination: { form: 'Schedule 1', line: '3' },
    rule: 'Sum of Schedule C net profit or (loss)',
  })

  // ── Total income & AGI ───────────────────────────────────────────────────────
  const totalIncome = money.add(
    wages,
    interest,
    ordinaryDividends,
    capitalGainDistributions,
    businessIncome,
  )
  addNode(graph, {
    id: 'form1040:9',
    label: 'Total income',
    value: totalIncome,
    kind: 'sum',
    inputs: [
      'form1040:1a',
      'form1040:2b',
      'form1040:3b',
      'form1040:7',
      'schedule1:3',
    ],
    destination: { form: 'Form 1040', line: '9' },
  })

  const adjustments = se.deductibleHalf
  addNode(graph, {
    id: 'form1040:10',
    label: 'Adjustments to income',
    value: adjustments,
    kind: 'sum',
    inputs: [se.deductionNodeId],
    destination: { form: 'Form 1040', line: '10' },
  })

  const agi = money.subtract(totalIncome, adjustments)
  addNode(graph, {
    id: 'form1040:11',
    label: 'Adjusted gross income',
    value: agi,
    kind: 'difference',
    inputs: ['form1040:9', 'form1040:10'],
    destination: { form: 'Form 1040', line: '11' },
  })

  // ── Deductions: standard vs itemized ─────────────────────────────────────────
  const standardDeduction = getStandardDeduction(filingStatus)
  const scheduleAForm = scenario.forms.find((f) => f.type === 'SCHEDULE_A')
  const itemized = scheduleAForm
    ? computeScheduleA(scheduleAForm, agi, filingStatus, graph)
    : null
  const itemizedTotal = itemized ? itemized.total : money.zero
  const useItemized = itemizedTotal > standardDeduction
  const deductions = useItemized ? itemizedTotal : standardDeduction
  const deductionType: 'standard' | 'itemized' = useItemized ? 'itemized' : 'standard'

  addNode(graph, {
    id: 'form1040:12',
    label: `Deduction (${deductionType})`,
    value: deductions,
    kind: useItemized ? 'sum' : 'maximum',
    inputs: useItemized && itemized ? [itemized.totalNodeId] : [],
    destination: { form: 'Form 1040', line: '12' },
    rule: useItemized
      ? 'Itemized deductions exceed the standard deduction'
      : `Standard deduction for ${filingStatus}`,
    children: [
      { label: 'Standard deduction', value: standardDeduction },
      { label: 'Itemized deductions', value: itemizedTotal },
    ],
  })

  // ── Taxable income ────────────────────────────────────────────────────────────
  const taxableIncome = money.roundIRS(
    money.max(money.zero, money.subtract(agi, deductions)),
  )
  addNode(graph, {
    id: 'form1040:15',
    label: 'Taxable income',
    value: taxableIncome,
    kind: 'difference',
    inputs: ['form1040:11', 'form1040:12'],
    destination: { form: 'Form 1040', line: '15' },
  })

  // ── Income tax (line 16) ────────────────────────────────────────────────────
  const usesPreferentialRates =
    qualifiedDividends > 0 || capitalGainDistributions > 0
  let incomeTax: Cents
  let line16NodeId: string
  if (usesPreferentialRates) {
    const qd = computeQualifiedDividendsTax(
      {
        taxableIncome,
        qualifiedDividends,
        eligibleNetCapitalGain: capitalGainDistributions,
        filingStatus,
      },
      graph,
    )
    incomeTax = qd.tax
    line16NodeId = qd.taxNodeId
  } else {
    const ordinary = computeOrdinaryTax(taxableIncome, filingStatus)
    incomeTax = ordinary.tax
    line16NodeId = 'form1040:line16'
    addNode(graph, {
      id: line16NodeId,
      label: 'Tax',
      value: incomeTax,
      kind: 'lookup',
      inputs: ['form1040:15'],
      destination: { form: 'Form 1040', line: '16' },
      rule:
        ordinary.method === 'tax-table'
          ? '2025 Tax Table'
          : '2025 Tax Computation Worksheet',
    })
  }

  // ── Additional Medicare Tax (Form 8959) ──────────────────────────────────────
  const additionalMedicare = computeAdditionalMedicareTax(
    medicareWages,
    se.netEarnings,
    filingStatus,
    graph,
  )

  // ── Child Tax Credit / ACTC (Schedule 8812) ──────────────────────────────────
  const earnedIncome = money.add(
    wages,
    money.max(money.zero, money.subtract(scheduleC.totalNet, se.deductibleHalf)),
  )
  const ssMedicareTaxes = money.add(
    sumFieldAcrossForms(scenario.forms, 'W2', 'box4'),
    sumFieldAcrossForms(scenario.forms, 'W2', 'box6'),
    se.seTax,
    additionalMedicare.tax,
  )
  const credit8812 = computeSchedule8812(
    {
      dependents: scenario.dependents,
      filingStatus,
      agi,
      taxLiability: incomeTax,
      earnedIncome,
      socialSecurityAndMedicareTaxes: ssMedicareTaxes,
    },
    graph,
  )

  const nonrefundableCredits = credit8812.nonrefundableCredit
  const taxAfterCredits = money.max(
    money.zero,
    money.subtract(incomeTax, nonrefundableCredits),
  )
  addNode(graph, {
    id: 'form1040:22',
    label: 'Tax after nonrefundable credits',
    value: taxAfterCredits,
    kind: 'difference',
    inputs: [line16NodeId, credit8812.nonrefundableNodeId],
    destination: { form: 'Form 1040', line: '22' },
  })

  // ── Other taxes (Schedule 2) ──────────────────────────────────────────────────
  const otherTaxes = money.add(se.seTax, additionalMedicare.tax)
  addNode(graph, {
    id: 'form1040:23',
    label: 'Other taxes (Schedule 2)',
    value: otherTaxes,
    kind: 'sum',
    inputs: [se.seTaxNodeId, additionalMedicare.taxNodeId],
    destination: { form: 'Form 1040', line: '23' },
  })

  const totalTax = money.add(taxAfterCredits, otherTaxes)
  addNode(graph, {
    id: 'form1040:24',
    label: 'Total tax',
    value: totalTax,
    kind: 'sum',
    inputs: ['form1040:22', 'form1040:23'],
    destination: { form: 'Form 1040', line: '24' },
  })

  // ── Payments ──────────────────────────────────────────────────────────────────
  const w2Withholding = sumFieldAcrossForms(scenario.forms, 'W2', 'box2')
  const intWithholding = sumFieldAcrossForms(scenario.forms, '1099_INT', 'box4')
  const divWithholding = sumFieldAcrossForms(scenario.forms, '1099_DIV', 'box4')
  const necWithholding = sumNecWithholding(scenario)
  const withholding = money.add(
    w2Withholding,
    intWithholding,
    divWithholding,
    necWithholding,
  )
  addNode(graph, {
    id: 'form1040:25',
    label: 'Federal income tax withheld',
    value: withholding,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Form 1040', line: '25' },
    children: [
      { label: 'W-2 box 2', value: w2Withholding },
      { label: '1099-INT box 4', value: intWithholding },
      { label: '1099-DIV box 4', value: divWithholding },
      { label: '1099-NEC box 4', value: necWithholding },
    ],
  })

  const estimatedPayments = scenario.estimatedPayments
  addNode(graph, {
    id: 'form1040:26',
    label: 'Estimated tax payments',
    value: estimatedPayments,
    kind: 'input',
    inputs: [],
    destination: { form: 'Form 1040', line: '26' },
  })

  const refundableCredits = credit8812.additionalChildTaxCredit
  const totalPayments = money.add(withholding, estimatedPayments, refundableCredits)
  addNode(graph, {
    id: 'form1040:33',
    label: 'Total payments',
    value: totalPayments,
    kind: 'sum',
    inputs: ['form1040:25', 'form1040:26', credit8812.refundableNodeId],
    destination: { form: 'Form 1040', line: '33' },
    children: [
      { label: 'Withholding', value: withholding, nodeId: 'form1040:25' },
      {
        label: 'Estimated payments',
        value: estimatedPayments,
        nodeId: 'form1040:26',
      },
      { label: 'Refundable ACTC', value: refundableCredits },
    ],
  })

  const refundOrDue = money.subtract(totalPayments, totalTax)
  addNode(graph, {
    id: 'form1040:34',
    label: 'Refund (positive) or amount due (negative)',
    value: refundOrDue,
    kind: 'difference',
    inputs: ['form1040:33', 'form1040:24'],
    destination: { form: 'Form 1040', line: '34/37' },
  })

  // ── Assemble totals & derived form values ─────────────────────────────────────
  const totals: Federal2025Totals = {
    income: totalIncome,
    adjustments,
    agi,
    deductions,
    deductionType,
    taxableIncome,
    incomeTax,
    nonrefundableCredits,
    selfEmploymentTax: se.seTax,
    additionalMedicareTax: additionalMedicare.tax,
    totalTax,
    withholding,
    estimatedPayments,
    refundableCredits,
    totalPayments,
    refundOrDue,
  }

  const scheduleCValues: DerivedFormValues['scheduleC'] = {}
  for (const r of scheduleC.results) {
    scheduleCValues[r.formId] = {
      grossReceipts: r.grossReceipts,
      costOfGoodsSold: r.costOfGoodsSold,
      totalExpenses: r.totalExpenses,
      netProfit: r.netProfit,
    }
  }

  const forms: DerivedFormValues = {
    form1040: {
      '1a': wages,
      '2b': interest,
      '3a': qualifiedDividends,
      '3b': ordinaryDividends,
      '7': capitalGainDistributions,
      '9': totalIncome,
      '10': adjustments,
      '11': agi,
      '12': deductions,
      '15': taxableIncome,
      '16': incomeTax,
      '19': nonrefundableCredits,
      '22': taxAfterCredits,
      '23': otherTaxes,
      '24': totalTax,
      '25': withholding,
      '28': refundableCredits,
      '33': totalPayments,
      '34': refundOrDue > 0 ? refundOrDue : money.zero,
      '37': refundOrDue < 0 ? -refundOrDue : money.zero,
    },
    schedule1: {
      '3': businessIncome,
      '15': se.deductibleHalf,
      '25': adjustments,
    },
    schedule2: {
      '4': se.seTax,
      '11': additionalMedicare.tax,
      '21': otherTaxes,
    },
    scheduleA: itemized
      ? {
          medical: itemized.medicalDeductible,
          salt: itemized.saltDeductible,
          mortgageInterest: itemized.mortgageInterest,
          charitable: itemized.charitable,
          total: itemized.total,
        }
      : {},
    scheduleC: scheduleCValues,
    scheduleSE: {
      netEarnings: se.netEarnings,
      seTax: se.seTax,
      deductibleHalf: se.deductibleHalf,
    },
    schedule8812: {
      qualifyingChildren: credit8812.qualifyingChildren,
      otherDependents: credit8812.otherDependents,
      nonrefundable: credit8812.nonrefundableCredit,
      additionalChildTaxCredit: credit8812.additionalChildTaxCredit,
    },
  }

  return { coverage, totals, forms, graph }
}
