import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Preferences, TaxScenario } from '../tax/types'

const DB_NAME = 'tax-scratchpad'
const DB_VERSION = 1
const PREFERENCES_KEY = 'preferences'

interface TaxScratchpadDB extends DBSchema {
  scenarios: {
    key: string
    value: TaxScenario
  }
  preferences: {
    key: string
    value: Preferences & { key: string }
  }
}

let dbPromise: Promise<IDBPDatabase<TaxScratchpadDB>> | null = null

function getDb(): Promise<IDBPDatabase<TaxScratchpadDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TaxScratchpadDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('scenarios')) {
          db.createObjectStore('scenarios', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllScenarios(): Promise<TaxScenario[]> {
  const db = await getDb()
  const scenarios = await db.getAll('scenarios')
  return scenarios.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function getScenario(
  id: string,
): Promise<TaxScenario | undefined> {
  const db = await getDb()
  return db.get('scenarios', id)
}

export async function putScenario(scenario: TaxScenario): Promise<void> {
  const db = await getDb()
  await db.put('scenarios', scenario)
}

export async function deleteScenario(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('scenarios', id)
}

const DEFAULT_PREFERENCES: Preferences = {}

export async function getPreferences(): Promise<Preferences> {
  const db = await getDb()
  const row = await db.get('preferences', PREFERENCES_KEY)
  if (!row) return { ...DEFAULT_PREFERENCES }
  return {
    lastScenarioId: row.lastScenarioId,
  }
}

export async function setPreferences(prefs: Preferences): Promise<void> {
  const db = await getDb()
  await db.put('preferences', { ...prefs, key: PREFERENCES_KEY })
}
