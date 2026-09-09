import type { FormDefinition } from '../../tax/types'

export const scheduleADefinition: FormDefinition = {
  type: 'SCHEDULE_A',
  title: 'Itemized Deductions',
  formNumber: 'Schedule A',
  taxYear: 2025,
  fields: [
    {
      id: 'medical',
      label: 'Medical and dental expenses',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.1'],
    },
    {
      id: 'stateLocalIncomeTax',
      label: 'State and local income taxes',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.5a'],
    },
    {
      id: 'realEstateTax',
      label: 'Real estate taxes',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.5b'],
    },
    {
      id: 'personalPropertyTax',
      label: 'Personal property taxes',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.5c'],
    },
    {
      id: 'mortgageInterest',
      label: 'Home mortgage interest (user-determined deductible)',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.8a'],
    },
    {
      id: 'charitableCash',
      label: 'Charitable contributions by cash or check (user-determined deductible)',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.11'],
    },
    {
      id: 'charitableNonCash',
      label: 'Charitable contributions other than by cash or check (user-determined deductible)',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_A.12'],
    },
  ],
}
