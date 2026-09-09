import type { FilingStatus, TaxFormType } from '../tax/types'

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_joint: 'Married filing jointly',
  married_separate: 'Married filing separately',
  head_of_household: 'Head of household',
}

export const FILING_STATUS_OPTIONS: Array<{ value: FilingStatus; label: string }> = [
  { value: 'single', label: FILING_STATUS_LABELS.single },
  { value: 'married_joint', label: FILING_STATUS_LABELS.married_joint },
  { value: 'married_separate', label: FILING_STATUS_LABELS.married_separate },
  { value: 'head_of_household', label: FILING_STATUS_LABELS.head_of_household },
]

/** Short label used for a form type in menus and the packet rail. */
export const FORM_TYPE_LABELS: Record<TaxFormType, string> = {
  W2: 'W-2',
  '1099_INT': '1099-INT',
  '1099_DIV': '1099-DIV',
  '1099_NEC': '1099-NEC',
  SCHEDULE_C: 'Schedule C',
  SCHEDULE_A: 'Itemized deductions',
  BASICS: 'Basics',
}

/** Form types the user can add from the "Add form" dialog. */
export const ADDABLE_FORM_TYPES: TaxFormType[] = [
  'W2',
  '1099_INT',
  '1099_DIV',
  '1099_NEC',
  'SCHEDULE_C',
  'SCHEDULE_A',
]

export const DISCLAIMER =
  'Tax Scratchpad is for hypothetical calculations and scenario exploration. It does not prepare or file tax returns and is not tax advice.'

export const STORAGE_NOTE = 'Stored only in this browser.'
