import { FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { centsOf, textOf, type InputRendererProps } from './types'

export function Form1099Int({ form, setValue }: InputRendererProps) {
  return (
    <FormFrame title="Form 1099-INT" meta="Interest Income · 2025">
      <FormSection>
        <TextLine
          fieldId="payerName"
          label="Payer name"
          value={textOf(form, 'payerName')}
          onCommit={(v) => setValue('payerName', v)}
        />
        <MoneyLine
          fieldId="box1"
          no="1"
          label="Interest income"
          value={centsOf(form, 'box1')}
          onCommit={(v) => setValue('box1', v)}
        />
        <MoneyLine
          fieldId="box4"
          no="4"
          label="Federal income tax withheld"
          value={centsOf(form, 'box4')}
          onCommit={(v) => setValue('box4', v)}
        />
      </FormSection>
    </FormFrame>
  )
}
