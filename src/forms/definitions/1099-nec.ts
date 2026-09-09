import type { FormDefinition } from '../../tax/types'

export const form1099NecDefinition: FormDefinition = {
  type: '1099_NEC',
  title: 'Nonemployee Compensation',
  formNumber: '1099-NEC',
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
      label: 'Nonemployee compensation',
      dataType: 'money',
      calculationUse: 'supported',
      mapsTo: ['SCHEDULE_C.gross'],
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
