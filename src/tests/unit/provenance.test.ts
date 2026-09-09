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
    const netNode = graph.nodes[netNodeId]
    expect(netNode).toBeDefined()
    expect(netNode.value).toBe(money.fromDollars(40_000))

    // Net profit node is wired into total income.
    expect(graph.nodes['form1040:9'].inputs).toContain(netNodeId)

    // Net profit node's ancestors include the gross receipts node.
    const ancestorIds = getAncestors(graph, netNodeId).map((n) => n.id)
    expect(ancestorIds).toContain(`scheduleC:${scheduleC.id}:gross`)

    expect(totals.income).toBe(money.fromDollars(40_000))
  })
})
