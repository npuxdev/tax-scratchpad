import { FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { centsOf, textOf, type InputRendererProps } from './types'

export function Form1099Div({ form, setValue }: InputRendererProps) {
  return (
    <FormFrame title="Form 1099-DIV" meta="Dividends and Distributions · 2025">
      <FormSection>
        <TextLine
          label="Payer name"
          value={textOf(form, 'payerName')}
          onCommit={(v) => setValue('payerName', v)}
        />
      </FormSection>
      <FormSection title="Boxes">
        <MoneyLine
          no="1a"
          label="Total ordinary dividends"
          value={centsOf(form, 'box1a')}
          onCommit={(v) => setValue('box1a', v)}
        />
        <MoneyLine
          no="1b"
          label="Qualified dividends"
          value={centsOf(form, 'box1b')}
          onCommit={(v) => setValue('box1b', v)}
        />
        <MoneyLine
          no="2a"
          label="Total capital gain distributions"
          value={centsOf(form, 'box2a')}
          onCommit={(v) => setValue('box2a', v)}
        />
        <MoneyLine
          no="4"
          label="Federal income tax withheld"
          value={centsOf(form, 'box4')}
          onCommit={(v) => setValue('box4', v)}
        />
        <MoneyLine
          no="5"
          label="Section 199A dividends"
          value={centsOf(form, 'box5')}
          onCommit={(v) => setValue('box5', v)}
        />
        <MoneyLine
          no="7"
          label="Foreign tax paid"
          value={centsOf(form, 'box7')}
          onCommit={(v) => setValue('box7', v)}
        />
      </FormSection>
    </FormFrame>
  )
}
