import type { FieldDataType } from '../tax/types'

/** Display metadata for a calculated form/schedule line. */
export interface DerivedLineMeta {
  /** IRS line number shown in the narrow first column. */
  no?: string
  label: string
  dataType: FieldDataType
  /** Calculation-graph node id, when a trace exists for this line. */
  nodeId?: string
  destination?: string
}

const LINE_NO = /^\d+[a-z]{0,2}$/i

const DERIVED_LINES: Record<string, Record<string, DerivedLineMeta>> = {
  '1040': {
    '1a': {
      no: '1a',
      label: 'Wages',
      dataType: 'money',
      nodeId: 'form1040:1a',
    },
    '2b': {
      no: '2b',
      label: 'Taxable interest',
      dataType: 'money',
      nodeId: 'form1040:2b',
    },
    '3a': {
      no: '3a',
      label: 'Qualified dividends',
      dataType: 'money',
      nodeId: 'form1040:3a',
    },
    '3b': {
      no: '3b',
      label: 'Ordinary dividends',
      dataType: 'money',
      nodeId: 'form1040:3b',
    },
    '7': {
      no: '7',
      label: 'Capital gain distributions',
      dataType: 'money',
      nodeId: 'form1040:7',
    },
    '9': {
      no: '9',
      label: 'Total income',
      dataType: 'money',
      nodeId: 'form1040:9',
    },
    '10': {
      no: '10',
      label: 'Adjustments to income',
      dataType: 'money',
      nodeId: 'form1040:10',
    },
    '11': {
      no: '11',
      label: 'Adjusted gross income',
      dataType: 'money',
      nodeId: 'form1040:11',
    },
    '12': {
      no: '12',
      label: 'Deduction',
      dataType: 'money',
      nodeId: 'form1040:12',
    },
    '15': {
      no: '15',
      label: 'Taxable income',
      dataType: 'money',
      nodeId: 'form1040:15',
    },
    '16': {
      no: '16',
      label: 'Tax',
      dataType: 'money',
      nodeId: 'form1040:line16',
    },
    '19': {
      no: '19',
      label: 'Child tax credit / credit for other dependents',
      dataType: 'money',
      nodeId: 'schedule8812:nonrefundable',
    },
    '22': {
      no: '22',
      label: 'Tax after nonrefundable credits',
      dataType: 'money',
      nodeId: 'form1040:22',
    },
    '23': {
      no: '23',
      label: 'Other taxes (Schedule 2)',
      dataType: 'money',
      nodeId: 'form1040:23',
    },
    '24': {
      no: '24',
      label: 'Total tax',
      dataType: 'money',
      nodeId: 'form1040:24',
    },
    '25': {
      no: '25',
      label: 'Federal income tax withheld',
      dataType: 'money',
      nodeId: 'form1040:25',
    },
    '28': {
      no: '28',
      label: 'Additional child tax credit',
      dataType: 'money',
      nodeId: 'schedule8812:actc',
    },
    '33': {
      no: '33',
      label: 'Total payments',
      dataType: 'money',
      nodeId: 'form1040:33',
    },
    '34': {
      no: '34',
      label: 'Refund',
      dataType: 'money',
      nodeId: 'form1040:34',
    },
    '37': {
      no: '37',
      label: 'Amount you owe',
      dataType: 'money',
      nodeId: 'form1040:34',
    },
  },
  schedule1: {
    '15': {
      no: '15',
      label: 'Deductible part of self-employment tax',
      dataType: 'money',
      nodeId: 'scheduleSE:deduction',
      destination: 'Form 1040 · 10',
    },
    '25': {
      no: '25',
      label: 'Adjustments to income',
      dataType: 'money',
      nodeId: 'form1040:10',
      destination: 'Form 1040 · 10',
    },
  },
  schedule2: {
    '4': {
      no: '4',
      label: 'Self-employment tax',
      dataType: 'money',
      nodeId: 'scheduleSE:tax',
      destination: 'Form 1040 · 23',
    },
    '11': {
      no: '11',
      label: 'Additional Medicare Tax',
      dataType: 'money',
      nodeId: 'form8959:additionalMedicare',
      destination: 'Form 1040 · 23',
    },
    '21': {
      no: '21',
      label: 'Total other taxes',
      dataType: 'money',
      nodeId: 'form1040:23',
      destination: 'Form 1040 · 23',
    },
  },
  scheduleSE: {
    netEarnings: {
      no: '4a',
      label: 'Net earnings from self-employment',
      dataType: 'money',
      nodeId: 'scheduleSE:netEarnings',
    },
    seTax: {
      no: '12',
      label: 'Self-employment tax',
      dataType: 'money',
      nodeId: 'scheduleSE:tax',
      destination: 'Schedule 2 · 4',
    },
    deductibleHalf: {
      no: '13',
      label: 'Deductible part of self-employment tax',
      dataType: 'money',
      nodeId: 'scheduleSE:deduction',
      destination: 'Schedule 1 · 15',
    },
  },
  schedule8812: {
    qualifyingChildren: {
      no: '1',
      label: 'Qualifying children under age 17',
      dataType: 'number',
    },
    otherDependents: {
      no: '3',
      label: 'Other dependents',
      dataType: 'number',
    },
    nonrefundable: {
      no: '14',
      label: 'Child tax credit and credit for other dependents',
      dataType: 'money',
      nodeId: 'schedule8812:nonrefundable',
      destination: 'Form 1040 · 19',
    },
    additionalChildTaxCredit: {
      no: '27',
      label: 'Additional child tax credit',
      dataType: 'money',
      nodeId: 'schedule8812:actc',
      destination: 'Form 1040 · 28',
    },
  },
}

/** Split a camelCase or snake_case key into a readable label. */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
  if (!spaced) return key
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Resolve display metadata for a calculated form line.
 * Known IRS lines win; otherwise numeric keys stay as line numbers and
 * camelCase keys become labels with an empty number column.
 */
export function resolveDerivedLine(
  formKey: string,
  line: string,
): DerivedLineMeta {
  const known = DERIVED_LINES[formKey]?.[line]
  if (known) return known
  if (LINE_NO.test(line)) {
    return { no: line, label: `Line ${line}`, dataType: 'money' }
  }
  return { label: humanizeKey(line), dataType: 'money' }
}
