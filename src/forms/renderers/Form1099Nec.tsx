import { useAppStore } from '../../state/AppStore'
import { FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { centsOf, textOf, type InputRendererProps } from './types'

export function Form1099Nec({ form, setValue }: InputRendererProps) {
  const { activeScenario } = useAppStore()
  const linkedId = form.relationships?.scheduleCId
  const linked = activeScenario?.forms.find((f) => f.id === linkedId)
  const linkedName =
    linked &&
    ((typeof linked.values.businessName === 'string' &&
      linked.values.businessName) ||
      linked.label)

  return (
    <FormFrame title="Form 1099-NEC" meta="Nonemployee Compensation · 2025">
      <FormSection>
        <TextLine
          fieldId="payerName"
          label="Payer name"
          value={textOf(form, 'payerName')}
          onCommit={(v) => setValue('payerName', v)}
        />
        <div className="tax-line">
          <span className="tax-line__no" />
          <span className="tax-line__label">Reported on</span>
          <span className="tax-line__value tax-line__value--empty">
            {linkedName ? `Schedule C · ${linkedName}` : 'Unlinked'}
          </span>
        </div>
      </FormSection>
      <FormSection title="Boxes">
        <MoneyLine
          fieldId="box1"
          no="1"
          label="Nonemployee compensation"
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
