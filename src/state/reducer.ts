import type {
  Cents,
  Dependent,
  FieldValue,
  FilingStatus,
  TaxFormInstance,
  TaxScenario,
  TaxpayerBasics,
} from '../tax/types'

export type ScenarioAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_FILING_STATUS'; filingStatus: FilingStatus }
  | { type: 'SET_BASICS'; patch: Partial<TaxpayerBasics> }
  | { type: 'SET_ESTIMATED_PAYMENTS'; amount: Cents }
  | { type: 'ADD_FORM'; form: TaxFormInstance }
  | { type: 'REMOVE_FORM'; formId: string }
  | { type: 'UPDATE_FORM_LABEL'; formId: string; label: string }
  | { type: 'SET_FORM_VALUE'; formId: string; fieldId: string; value: FieldValue }
  | { type: 'SET_FORM_RELATIONSHIP'; formId: string; scheduleCId: string }
  | { type: 'ADD_DEPENDENT'; dependent: Dependent }
  | { type: 'UPDATE_DEPENDENT'; id: string; patch: Partial<Dependent> }
  | { type: 'REMOVE_DEPENDENT'; id: string }
  | { type: 'REPLACE_SCENARIO'; scenario: TaxScenario }

function touch(state: TaxScenario): TaxScenario {
  return { ...state, updatedAt: new Date().toISOString() }
}

export function scenarioReducer(
  state: TaxScenario,
  action: ScenarioAction,
): TaxScenario {
  switch (action.type) {
    case 'SET_NAME':
      return touch({ ...state, name: action.name })

    case 'SET_FILING_STATUS': {
      const filingStatus = action.filingStatus
      const isJoint = filingStatus === 'married_joint'
      const basics: TaxpayerBasics = {
        ...state.basics,
        filingStatus,
        spouseAgeAtEndOfYear: isJoint
          ? (state.basics.spouseAgeAtEndOfYear ?? 40)
          : undefined,
        spouseHasValidSSNOrITIN: isJoint
          ? (state.basics.spouseHasValidSSNOrITIN ?? true)
          : false,
        spouseBlind: isJoint ? state.basics.spouseBlind : false,
      }
      return touch({ ...state, basics })
    }

    case 'SET_BASICS':
      return touch({
        ...state,
        basics: { ...state.basics, ...action.patch },
      })

    case 'SET_ESTIMATED_PAYMENTS':
      return touch({ ...state, estimatedPayments: action.amount })

    case 'ADD_FORM':
      return touch({ ...state, forms: [...state.forms, action.form] })

    case 'REMOVE_FORM': {
      const removed = state.forms.find((f) => f.id === action.formId)
      let forms = state.forms.filter((f) => f.id !== action.formId)
      if (removed?.type === 'SCHEDULE_C') {
        forms = forms.map((form) => {
          if (form.relationships?.scheduleCId !== action.formId) return form
          return { ...form, relationships: undefined }
        })
      }
      return touch({ ...state, forms })
    }

    case 'UPDATE_FORM_LABEL':
      return touch({
        ...state,
        forms: state.forms.map((form) =>
          form.id === action.formId ? { ...form, label: action.label } : form,
        ),
      })

    case 'SET_FORM_VALUE':
      return touch({
        ...state,
        forms: state.forms.map((form) =>
          form.id === action.formId
            ? {
                ...form,
                values: { ...form.values, [action.fieldId]: action.value },
              }
            : form,
        ),
      })

    case 'SET_FORM_RELATIONSHIP':
      return touch({
        ...state,
        forms: state.forms.map((form) =>
          form.id === action.formId
            ? {
                ...form,
                relationships: {
                  ...form.relationships,
                  scheduleCId: action.scheduleCId,
                },
              }
            : form,
        ),
      })

    case 'ADD_DEPENDENT':
      return touch({
        ...state,
        dependents: [...state.dependents, action.dependent],
      })

    case 'UPDATE_DEPENDENT':
      return touch({
        ...state,
        dependents: state.dependents.map((dependent) =>
          dependent.id === action.id
            ? { ...dependent, ...action.patch }
            : dependent,
        ),
      })

    case 'REMOVE_DEPENDENT':
      return touch({
        ...state,
        dependents: state.dependents.filter((d) => d.id !== action.id),
      })

    case 'REPLACE_SCENARIO':
      return touch({ ...action.scenario })
  }
}
