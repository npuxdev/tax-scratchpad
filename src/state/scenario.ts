import { money } from '../tax/money'
import type {
  FieldValue,
  FilingStatus,
  TaxFormInstance,
  TaxFormType,
  TaxScenario,
  TaxpayerBasics,
} from '../tax/types'

export function createId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function defaultBasics(filingStatus: FilingStatus): TaxpayerBasics {
  const isJoint = filingStatus === 'married_joint'
  return {
    filingStatus,
    taxpayerAgeAtEndOfYear: 40,
    spouseAgeAtEndOfYear: isJoint ? 40 : undefined,
    taxpayerBlind: false,
    spouseBlind: false,
    taxpayerHasValidEmploymentSSN: true,
    spouseHasValidSSNOrITIN: isJoint ? true : false,
  }
}

export function createEmptyScenario(
  name: string,
  filingStatus: FilingStatus,
): TaxScenario {
  const timestamp = nowIso()
  return {
    id: createId(),
    name,
    schemaVersion: 1,
    taxYear: 2025,
    ruleSet: 'federal-2025-v1',
    createdAt: timestamp,
    updatedAt: timestamp,
    basics: defaultBasics(filingStatus),
    dependents: [],
    forms: [],
    estimatedPayments: money.zero,
  }
}

const DEFAULT_LABELS: Record<TaxFormType, string> = {
  W2: 'W-2',
  '1099_INT': '1099-INT',
  '1099_DIV': '1099-DIV',
  '1099_NEC': '1099-NEC',
  SCHEDULE_C: 'Schedule C',
  SCHEDULE_A: 'Itemized deductions',
  BASICS: 'Basics',
}

function defaultValues(type: TaxFormType): Record<string, FieldValue> {
  switch (type) {
    case 'W2':
      return {
        employerName: '',
        box1: money.zero,
        box2: money.zero,
        box3: money.zero,
        box4: money.zero,
        box5: money.zero,
        box6: money.zero,
        box10: money.zero,
        box11: money.zero,
        box12: '',
      }
    case '1099_INT':
      return {
        payerName: '',
        box1: money.zero,
        box4: money.zero,
      }
    case '1099_DIV':
      return {
        payerName: '',
        box1a: money.zero,
        box1b: money.zero,
        box2a: money.zero,
        box2b: money.zero,
        box3: money.zero,
        box4: money.zero,
        box5: money.zero,
        box6: money.zero,
        box7: money.zero,
        box8: '',
        box9: money.zero,
        box10: money.zero,
        box12: money.zero,
        box13: money.zero,
      }
    case '1099_NEC':
      return {
        payerName: '',
        box1: money.zero,
        box4: money.zero,
      }
    case 'SCHEDULE_C':
      return {
        businessName: '',
        otherGrossReceipts: money.zero,
        returnsAndAllowances: money.zero,
        advertising: money.zero,
        carAndTruck: money.zero,
        commissions: money.zero,
        contractLabor: money.zero,
        insurance: money.zero,
        legal: money.zero,
        office: money.zero,
        supplies: money.zero,
        travel: money.zero,
        utilities: money.zero,
        wages: money.zero,
        otherExpenses: money.zero,
        businessMeals: money.zero,
        costOfGoodsSold: money.zero,
        hasDepreciation: false,
        hasHomeOffice: false,
      }
    case 'SCHEDULE_A':
      return {
        medical: money.zero,
        stateLocalIncomeTax: money.zero,
        realEstateTax: money.zero,
        personalPropertyTax: money.zero,
        mortgageInterest: money.zero,
        charitableCash: money.zero,
        charitableNonCash: money.zero,
      }
    case 'BASICS':
      return {
        taxpayerName: '',
        spouseName: '',
        taxpayerAgeAtEndOfYear: 40,
        spouseAgeAtEndOfYear: 40,
        taxpayerBlind: false,
        spouseBlind: false,
        taxpayerHasValidEmploymentSSN: true,
        spouseHasValidSSNOrITIN: true,
      }
  }
}

export function createFormInstance(
  type: TaxFormType,
  label?: string,
  relationships?: TaxFormInstance['relationships'],
): TaxFormInstance {
  return {
    id: createId(),
    type,
    label: label ?? DEFAULT_LABELS[type],
    values: defaultValues(type),
    ...(relationships ? { relationships } : {}),
  }
}

/** Wipe forms, dependents, and basics back to defaults; keep id and name. */
export function resetScenarioContents(scenario: TaxScenario): TaxScenario {
  const blank = createEmptyScenario(scenario.name, scenario.basics.filingStatus)
  return {
    ...blank,
    id: scenario.id,
    createdAt: scenario.createdAt,
  }
}

export function duplicateScenario(scenario: TaxScenario): TaxScenario {
  const timestamp = nowIso()
  const idMap = new Map<string, string>()

  for (const form of scenario.forms) {
    idMap.set(form.id, createId())
  }

  const dependentIdMap = new Map<string, string>()
  for (const dependent of scenario.dependents) {
    dependentIdMap.set(dependent.id, createId())
  }

  const forms: TaxFormInstance[] = scenario.forms.map((form) => {
    const newId = idMap.get(form.id)!
    let relationships = form.relationships
    if (form.type === '1099_NEC' && form.relationships?.scheduleCId) {
      const newScheduleCId = idMap.get(form.relationships.scheduleCId)
      relationships = newScheduleCId
        ? { scheduleCId: newScheduleCId }
        : undefined
    } else if (form.relationships) {
      relationships = { ...form.relationships }
      if (relationships.scheduleCId) {
        const mapped = idMap.get(relationships.scheduleCId)
        relationships = mapped
          ? { ...relationships, scheduleCId: mapped }
          : { ...relationships, scheduleCId: undefined }
      }
    }

    return {
      ...form,
      id: newId,
      values: { ...form.values },
      ...(relationships ? { relationships } : { relationships: undefined }),
    }
  })

  return {
    ...scenario,
    id: createId(),
    name: `${scenario.name} copy`,
    createdAt: timestamp,
    updatedAt: timestamp,
    basics: { ...scenario.basics },
    dependents: scenario.dependents.map((dependent) => ({
      ...dependent,
      id: dependentIdMap.get(dependent.id)!,
    })),
    forms,
    estimatedPayments: scenario.estimatedPayments,
  }
}
