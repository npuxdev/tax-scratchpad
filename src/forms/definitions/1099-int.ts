import type { FormDefinition } from '../../tax/types'

export const form1099IntDefinition: FormDefinition = {
  type: '1099_INT',
  title: 'Interest Income',
  formNumber: '1099-INT',
  taxYear: 2025,
  fields: [
    {
      id: 'payerName',
      label: 'Payer name',
      dataType: 'text',
      calculationUse: 'informational',
    },
    {
      id: 'box1',
      box: '1',
      label: 'Interest income',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['1040.2b'],
    },
    {
      id: 'box4',
      box: '4',
      label: 'Federal income tax withheld',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['1040.25b'],
    },
  ],
}
