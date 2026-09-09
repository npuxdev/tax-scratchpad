import type {
  CalculationGraph,
  CalculationNode,
  Cents,
  TaxFormInstance,
  TaxScenario,
} from '../types'
import { money } from '../money'
import { addNode } from '../graph'
import { BUSINESS_MEALS_DEDUCTIBLE_RATE, SOURCE_BUSINESS_MEALS } from './constants'
import { moneyValue } from './form-1040'

/** Ordinary Schedule C expense categories (excluding meals, handled separately). */
const EXPENSE_FIELDS = [
  'advertising',
  'carAndTruck',
  'commissions',
  'contractLabor',
  'insurance',
  'legal',
  'office',
  'supplies',
  'travel',
  'utilities',
  'wages',
  'otherExpenses',
] as const

export interface ScheduleCResult {
  formId: string
  businessName: string
  grossReceipts: Cents
  totalExpenses: Cents
  costOfGoodsSold: Cents
  netProfit: Cents
  /** Node id of the net profit node in the graph. */
  netProfitNodeId: string
}

export interface ScheduleCAggregate {
  results: ScheduleCResult[]
  /** Sum of every business's net profit (losses offset profits). */
  totalNet: Cents
}

function linkedNecReceipts(
  scenario: TaxScenario,
  scheduleCId: string,
): Cents {
  let total = 0
  for (const form of scenario.forms) {
    if (form.type !== '1099_NEC') continue
    if (form.relationships?.scheduleCId !== scheduleCId) continue
    total += moneyValue(form.values.box1)
  }
  return total
}

function computeOne(
  scenario: TaxScenario,
  form: TaxFormInstance,
  graph: CalculationGraph,
): ScheduleCResult {
  const businessName =
    typeof form.values.businessName === 'string' && form.values.businessName
      ? form.values.businessName
      : form.label

  const necReceipts = linkedNecReceipts(scenario, form.id)
  const otherReceipts = moneyValue(form.values.otherGrossReceipts)
  const returns = moneyValue(form.values.returnsAndAllowances)
  const grossReceipts = money.subtract(
    money.add(necReceipts, otherReceipts),
    returns,
  )

  let ordinaryExpenses = 0
  for (const field of EXPENSE_FIELDS) {
    ordinaryExpenses += moneyValue(form.values[field])
  }
  const meals = moneyValue(form.values.businessMeals)
  const deductibleMeals = money.multiplyRate(
    meals,
    BUSINESS_MEALS_DEDUCTIBLE_RATE,
  )
  const totalExpenses = money.add(ordinaryExpenses, deductibleMeals)
  const costOfGoodsSold = moneyValue(form.values.costOfGoodsSold)

  const netProfit = money.subtract(
    money.subtract(grossReceipts, costOfGoodsSold),
    totalExpenses,
  )

  const grossNodeId = `scheduleC:${form.id}:gross`
  addNode(graph, {
    id: grossNodeId,
    label: `${businessName} — gross receipts`,
    value: grossReceipts,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Schedule C', line: '7' },
    rule: 'Gross receipts = linked 1099-NEC box 1 + other receipts − returns & allowances',
    children: [
      { label: '1099-NEC box 1 (linked)', value: necReceipts },
      { label: 'Other gross receipts', value: otherReceipts },
      { label: 'Returns and allowances', value: -returns },
    ],
  })

  const expenseNodeId = `scheduleC:${form.id}:expenses`
  addNode(graph, {
    id: expenseNodeId,
    label: `${businessName} — total expenses`,
    value: totalExpenses,
    kind: 'sum',
    inputs: [],
    destination: { form: 'Schedule C', line: '28' },
    rule: 'Sum of expense categories + 50% of business meals',
    sourceAuthority: SOURCE_BUSINESS_MEALS,
    children: [
      { label: 'Ordinary expenses', value: ordinaryExpenses },
      { label: 'Business meals (50%)', value: deductibleMeals },
    ],
  })

  const netProfitNodeId = `scheduleC:${form.id}:net`
  const netNode: CalculationNode = {
    id: netProfitNodeId,
    label: `${businessName} — net profit`,
    value: netProfit,
    kind: 'difference',
    inputs: [grossNodeId, expenseNodeId],
    destination: { form: 'Schedule C', line: '31' },
    rule: 'Net profit = gross receipts − cost of goods sold − total expenses',
    children: [
      { label: 'Gross receipts', value: grossReceipts, nodeId: grossNodeId },
      { label: 'Cost of goods sold', value: -costOfGoodsSold },
      { label: 'Total expenses', value: -totalExpenses, nodeId: expenseNodeId },
    ],
  }
  addNode(graph, netNode)

  return {
    formId: form.id,
    businessName,
    grossReceipts,
    totalExpenses,
    costOfGoodsSold,
    netProfit,
    netProfitNodeId,
  }
}

/**
 * Compute every Schedule C in the scenario. Losses are allowed and offset profits
 * in `totalNet`.
 */
export function computeAllScheduleC(
  scenario: TaxScenario,
  graph: CalculationGraph,
): ScheduleCAggregate {
  const results: ScheduleCResult[] = []
  let totalNet = 0
  for (const form of scenario.forms) {
    if (form.type !== 'SCHEDULE_C') continue
    const result = computeOne(scenario, form, graph)
    results.push(result)
    totalNet += result.netProfit
  }
  return { results, totalNet }
}
