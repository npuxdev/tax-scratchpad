import { FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { centsOf, textOf, type InputRendererProps } from './types'

export function W2Form({ form, setValue }: InputRendererProps) {
  return (
    <FormFrame title="Form W-2" meta="Wage and Tax Statement · 2025">
      <FormSection>
        <TextLine
          fieldId="employerName"
          label="Employer name"
          value={textOf(form, 'employerName')}
          onCommit={(v) => setValue('employerName', v)}
        />
      </FormSection>
      <FormSection title="Boxes">
        <MoneyLine
          fieldId="box1"
          no="1"
          label="Wages, tips, other compensation"
          value={centsOf(form, 'box1')}
          onCommit={(v) => setValue('box1', v)}
        />
        <MoneyLine
          fieldId="box2"
          no="2"
          label="Federal income tax withheld"
          value={centsOf(form, 'box2')}
          onCommit={(v) => setValue('box2', v)}
        />
        <MoneyLine
          fieldId="box3"
          no="3"
          label="Social Security wages"
          value={centsOf(form, 'box3')}
          onCommit={(v) => setValue('box3', v)}
        />
        <MoneyLine
          fieldId="box4"
          no="4"
          label="Social Security tax withheld"
          value={centsOf(form, 'box4')}
          onCommit={(v) => setValue('box4', v)}
        />
        <MoneyLine
          fieldId="box5"
          no="5"
          label="Medicare wages and tips"
          value={centsOf(form, 'box5')}
          onCommit={(v) => setValue('box5', v)}
        />
        <MoneyLine
          fieldId="box6"
          no="6"
          label="Medicare tax withheld"
          value={centsOf(form, 'box6')}
          onCommit={(v) => setValue('box6', v)}
        />
        <MoneyLine
          fieldId="box10"
          no="10"
          label="Dependent care benefits"
          value={centsOf(form, 'box10')}
          onCommit={(v) => setValue('box10', v)}
        />
        <MoneyLine
          fieldId="box11"
          no="11"
          label="Nonqualified plans"
          value={centsOf(form, 'box11')}
          onCommit={(v) => setValue('box11', v)}
        />
        <TextLine
          fieldId="box12"
          no="12"
          label="Box 12 codes"
          value={textOf(form, 'box12')}
          onCommit={(v) => setValue('box12', v)}
        />
      </FormSection>
    </FormFrame>
  )
}
