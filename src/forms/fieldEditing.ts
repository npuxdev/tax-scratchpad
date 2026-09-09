import { money } from '../tax/money'
import type { FieldDataType, FieldValue } from '../tax/types'

/** Display a stored field value for a given data type. */
export function formatFieldValue(
  value: FieldValue,
  dataType: FieldDataType,
): string {
  switch (dataType) {
    case 'money':
      return typeof value === 'number' ? money.format(value) : '—'
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'number':
      return typeof value === 'number' ? String(value) : '—'
    case 'text':
    case 'date':
    case 'enum':
      return typeof value === 'string' && value ? value : '—'
    default:
      return '—'
  }
}

/** The raw string an editor should start with for a stored value. */
export function toEditableString(
  value: FieldValue,
  dataType: FieldDataType,
): string {
  if (value === null || value === undefined) return ''
  switch (dataType) {
    case 'money':
      return typeof value === 'number' ? String(money.toDollars(value)) : ''
    case 'number':
      return typeof value === 'number' ? String(value) : ''
    case 'boolean':
      return value ? 'true' : 'false'
    default:
      return typeof value === 'string' ? value : ''
  }
}

export interface ParseResult {
  ok: boolean
  value?: FieldValue
  error?: string
}

/** Parse a raw editor string into a stored field value. */
export function parseFieldValue(
  raw: string,
  dataType: FieldDataType,
): ParseResult {
  const trimmed = raw.trim()
  switch (dataType) {
    case 'money': {
      if (trimmed === '') return { ok: true, value: money.zero }
      const cents = money.parse(trimmed)
      if (cents === null) return { ok: false, error: 'Enter a dollar amount' }
      return { ok: true, value: cents }
    }
    case 'number': {
      if (trimmed === '') return { ok: true, value: 0 }
      const n = Number(trimmed)
      if (!Number.isFinite(n)) return { ok: false, error: 'Enter a number' }
      return { ok: true, value: n }
    }
    case 'boolean':
      return { ok: true, value: trimmed === 'true' }
    default:
      return { ok: true, value: raw }
  }
}
