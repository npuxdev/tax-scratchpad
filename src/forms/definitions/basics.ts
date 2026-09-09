import type { FormDefinition } from '../../tax/types'

export const basicsDefinition: FormDefinition = {
  type: 'BASICS',
  title: 'Taxpayer basics',
  formNumber: 'Basics',
  taxYear: 2025,
  fields: [
    {
      id: 'taxpayerName',
      label: 'Taxpayer name',
      dataType: 'text',
      calculationUse: 'informational',
    },
    {
      id: 'spouseName',
      label: 'Spouse name',
      dataType: 'text',
      calculationUse: 'informational',
    },
    {
      id: 'taxpayerAgeAtEndOfYear',
      label: 'Taxpayer age at end of 2025',
      dataType: 'number',
      calculationUse: 'supported',
    },
    {
      id: 'spouseAgeAtEndOfYear',
      label: 'Spouse age at end of 2025',
      dataType: 'number',
      calculationUse: 'supported',
    },
    {
      id: 'taxpayerBlind',
      label: 'Taxpayer is blind',
      dataType: 'boolean',
      calculationUse: 'supported',
    },
    {
      id: 'spouseBlind',
      label: 'Spouse is blind',
      dataType: 'boolean',
      calculationUse: 'supported',
    },
    {
      id: 'taxpayerHasValidEmploymentSSN',
      label: 'Taxpayer has valid employment SSN',
      dataType: 'boolean',
      calculationUse: 'supported',
    },
    {
      id: 'spouseHasValidSSNOrITIN',
      label: 'Spouse has valid SSN or ITIN',
      dataType: 'boolean',
      calculationUse: 'supported',
    },
  ],
}
