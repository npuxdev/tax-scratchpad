import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'
import { getAncestors } from '../../tax/graph'
import { createEmptyScenario, createFormInstance } from '../../state/scenario'
import { createExampleReturn } from '../../fixtures/example-return'
import { calculateFederal2025 } from '../../tax/2025/calculate'

describe('calculation graph provenance', () => {
  it('traces W-2 wages up to AGI', () => {
    const { graph } = calculateFederal2025(createExampleReturn())

    const wagesNode = graph.nodes['form1040:1a']
    expect(wagesNode).toBeDefined()
    expect(wagesNode.value).toBe(money.fromDollars(56_800))

    const totalIncome = graph.nodes['form1040:9']
    expect(totalIncome.inputs).toContain('form1040:1a')

    // AGI depends (transitively) on wages.
    const agiAncestors = getAncestors(graph, 'form1040:11').map((n) => n.id)
    expect(agiAncestors).toContain('form1040:9')
    expect(agiAncestors).toContain('form1040:1a')
  })

  it('creates Schedule C provenance and feeds total income', () => {
    const scenario = createEmptyScenario('Freelancer', 'single')
    const scheduleC = createFormInstance('SCHEDULE_C')
    scheduleC.values.businessName = 'Consulting'
    const nec = createFormInstance('1099_NEC', undefined, {
      scheduleCId: scheduleC.id,
    })
    nec.values.box1 = money.fromDollars(40_000)
    scenario.forms = [scheduleC, nec]

    const { graph, totals } = calculateFederal2025(scenario)

    const netNodeId = `scheduleC:${scheduleC.id}:net`
    const expenseNodeId = `scheduleC:${scheduleC.id}:expenses`
    const netNode = graph.nodes[netNodeId]
    expect(netNode).toBeDefined()
    expect(netNode.value).toBe(money.fromDollars(40_000))

    // Schedule 1 line 3 bridges Schedule C into Form 1040.
    expect(graph.nodes['schedule1:3']).toBeDefined()
    expect(graph.nodes['schedule1:3'].inputs).toContain(netNodeId)
    expect(graph.nodes['form1040:9'].inputs).toContain('schedule1:3')

    // Net profit node's ancestors include the gross receipts node.
    const ancestorIds = getAncestors(graph, netNodeId).map((n) => n.id)
    expect(ancestorIds).toContain(`scheduleC:${scheduleC.id}:gross`)

    // Full path: expenses → net → Schedule 1 → AGI → taxable → tax → refund/due
    const dueAncestors = getAncestors(graph, 'form1040:34').map((n) => n.id)
    expect(dueAncestors).toContain(expenseNodeId)
    expect(dueAncestors).toContain(netNodeId)
    expect(dueAncestors).toContain('schedule1:3')
    expect(dueAncestors).toContain('form1040:9')
    expect(dueAncestors).toContain('form1040:11')
    expect(dueAncestors).toContain('form1040:15')
    expect(dueAncestors).toContain('form1040:line16')

    expect(totals.income).toBe(money.fromDollars(40_000))
  })
})
