import type { TaxScenario } from '../tax/types'

export interface ScenarioExportDocument {
  schemaVersion: 1
  taxYear: 2025
  ruleSet: 'federal-2025-v1'
  scenario: TaxScenario
}

export function exportScenario(scenario: TaxScenario): ScenarioExportDocument {
  return {
    schemaVersion: 1,
    taxYear: 2025,
    ruleSet: 'federal-2025-v1',
    scenario,
  }
}

export function exportScenarioJson(scenario: TaxScenario): string {
  return JSON.stringify(exportScenario(scenario), null, 2)
}
