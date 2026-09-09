import { FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { centsOf, textOf, type InputRendererProps } from './types'

export function W2Form({ form, setValue }: InputRendererProps) {
  return (
    <FormFrame title="Form W-2" meta="Wage and Tax Statement · 2025">
      <FormSection>
        <TextLine
          label="Employer name"
          value={textOf(form, 'employerName')}
          onCommit={(v) => setValue('employerName', v)}
        />
      </FormSection>
      <FormSection title="Boxes">
        <MoneyLine
          no="1"
          label="Wages, tips, other compensation"
          value={centsOf(form, 'box1')}
          onCommit={(v) => setValue('box1', v)}
        />
        <MoneyLine
          no="2"
          label="Federal income tax withheld"
          value={centsOf(form, 'box2')}
          onCommit={(v) => setValue('box2', v)}
        />
        <MoneyLine
          no="3"
          label="Social Security wages"
          value={centsOf(form, 'box3')}
          onCommit={(v) => setValue('box3', v)}
        />
        <MoneyLine
          no="4"
          label="Social Security tax withheld"
          value={centsOf(form, 'box4')}
          onCommit={(v) => setValue('box4', v)}
        />
        <MoneyLine
          no="5"
          label="Medicare wages and tips"
          value={centsOf(form, 'box5')}
          onCommit={(v) => setValue('box5', v)}
        />
        <MoneyLine
          no="6"
          label="Medicare tax withheld"
          value={centsOf(form, 'box6')}
          onCommit={(v) => setValue('box6', v)}
        />
        <MoneyLine
          no="10"
          label="Dependent care benefits"
          value={centsOf(form, 'box10')}
          onCommit={(v) => setValue('box10', v)}
        />
        <MoneyLine
          no="11"
          label="Nonqualified plans"
          value={centsOf(form, 'box11')}
          onCommit={(v) => setValue('box11', v)}
        />
        <TextLine
          no="12"
          label="Box 12 codes"
          value={textOf(form, 'box12')}
          onCommit={(v) => setValue('box12', v)}
        />
      </FormSection>
    </FormFrame>
  )
}
