import type { TaxScenario } from '../tax/types'

/**
 * Migrate a raw scenario payload to the current schema.
 * Currently only schemaVersion 1 is supported — no transforms applied.
 */
export function migrateScenario(raw: unknown): TaxScenario {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    (raw as { schemaVersion?: unknown }).schemaVersion !== 1
  ) {
    throw new Error('Unsupported schemaVersion (expected 1)')
  }
  return raw as TaxScenario
}
