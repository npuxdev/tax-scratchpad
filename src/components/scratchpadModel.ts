import { getFormDefinition } from '../forms/definitions'
import { resolveDerivedLine } from '../forms/derivedLines'
import type {
  CalculationUse,
  Federal2025Result,
  TaxFormInstance,
  TaxScenario,
} from '../tax/types'
import { FORM_TYPE_LABELS } from '../app/labels'
import { ALL_SELECTION } from '../app/packet'
import type { RowStatus, ScratchRow } from './ScratchpadRow'
import type { SectionModel } from './ScratchpadSection'

function statusFor(use: CalculationUse): RowStatus {
  switch (use) {
    case 'supported':
      return 'counted'
    case 'informational':
      return 'noted'
    case 'unsupported-trigger':
      return 'blocking'
  }
}

/** Human-readable destination for a field's first `mapsTo` entry. */
export function prettyDestination(mapsTo?: string[]): string | undefined {
  if (!mapsTo || mapsTo.length === 0) return undefined
  const raw = mapsTo[0]
  if (raw === 'SE') return 'Schedule SE'
  const [form, line] = raw.split('.')
  if (form === '1040') return `Form 1040 · ${line}`
  if (form === 'SCHEDULE_C')
    return line === 'gross' ? 'Schedule C' : `Schedule C · ${line}`
  if (form === 'SCHEDULE_A') return `Schedule A · ${line}`
  return raw
}

function rowsForForm(form: TaxFormInstance): ScratchRow[] {
  const def = getFormDefinition(form.type)
  return def.fields.map((field) => ({
    key: `${form.id}:${field.id}`,
    formId: form.id,
    fieldId: field.id,
    label: field.label,
    box: field.box,
    dataType: field.dataType,
    value: form.values[field.id] ?? null,
    destination: prettyDestination(field.mapsTo),
    status: statusFor(field.calculationUse),
    editable: true,
  }))
}

export interface ScratchpadModel {
  sections: SectionModel[]
  /** Flat, index-aligned rows for keyboard traversal. */
  flat: ScratchRow[]
  /** True when the selection is a read-only derived form. */
  readOnly: boolean
}

/**
 * Builds the scratchpad sections (and a flat, index-aligned row list) for the
 * current selection. Basics is handled by a dedicated editor, not here.
 */
export function buildScratchpadModel(
  scenario: TaxScenario,
  calculation: Federal2025Result | null,
  selectedFormId: string | null,
): ScratchpadModel {
  const sections: SectionModel[] = []
  const flat: ScratchRow[] = []
  let readOnly = false

  const pushSection = (
    key: string,
    title: string,
    rows: ScratchRow[],
    meta?: string,
  ) => {
    const withIndex = rows.map((row) => {
      const index = flat.length
      flat.push(row)
      return { row, index }
    })
    sections.push({ key, title, meta, rows: withIndex })
  }

  // Derived / calculated pure form selected.
  if (selectedFormId && selectedFormId.startsWith('calc:')) {
    readOnly = true
    const key = selectedFormId.slice('calc:'.length)
    const map: Record<string, Record<string, number | string | null> | undefined> =
      {
        '1040': calculation?.forms.form1040,
        schedule1: calculation?.forms.schedule1,
        schedule2: calculation?.forms.schedule2,
        scheduleSE: calculation?.forms.scheduleSE,
        schedule8812: calculation?.forms.schedule8812,
      }
    const rec = map[key] ?? {}
    const rows: ScratchRow[] = Object.entries(rec).map(([line, value]) => {
      const meta = resolveDerivedLine(key, line)
      return {
        key: `calc:${key}:${line}`,
        formId: selectedFormId,
        fieldId: line,
        label: meta.no ? `${meta.no}  ${meta.label}` : meta.label,
        dataType: meta.dataType,
        value: typeof value === 'number' ? value : null,
        destination: meta.destination,
        status: 'counted' as const,
        editable: false,
      }
    })
    pushSection(
      selectedFormId,
      'Calculated form',
      rows,
      rows.length === 0 ? 'Values appear once inputs are entered' : undefined,
    )
    return { sections, flat, readOnly }
  }

  // A single input form (Schedule A/C included since they carry a real id).
  const single = scenario.forms.find((f) => f.id === selectedFormId)
  if (single) {
    pushSection(single.id, FORM_TYPE_LABELS[single.type], rowsForForm(single))
    return { sections, flat, readOnly }
  }

  // Everything (default / ALL): all input forms in packet order.
  if (selectedFormId === null || selectedFormId === ALL_SELECTION) {
    for (const form of scenario.forms) {
      const title = form.label || FORM_TYPE_LABELS[form.type]
      pushSection(form.id, title, rowsForForm(form))
    }
    if (sections.length === 0) {
      sections.push({
        key: 'empty',
        title: 'No forms yet',
        meta: 'Add a form to start entering values',
        rows: [],
      })
    }
  }

  return { sections, flat, readOnly }
}
