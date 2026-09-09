import type { Federal2025Result } from '../../tax/types'
import { DerivedLine, FormFrame, FormSection, MoneyLine } from './parts'
import { centsOf, type InputRendererProps } from './types'

interface ScheduleAProps extends InputRendererProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function ScheduleA({ form, setValue, calculation, onTrace }: ScheduleAProps) {
  const derived = calculation?.forms.scheduleA ?? {}

  return (
    <FormFrame title="Schedule A" meta="Itemized Deductions · 2025">
      <FormSection title="Taxes you paid">
        <MoneyLine
          no="5a"
          label="State and local income taxes"
          value={centsOf(form, 'stateLocalIncomeTax')}
          onCommit={(v) => setValue('stateLocalIncomeTax', v)}
        />
        <MoneyLine
          no="5b"
          label="Real estate taxes"
          value={centsOf(form, 'realEstateTax')}
          onCommit={(v) => setValue('realEstateTax', v)}
        />
        <MoneyLine
          no="5c"
          label="Personal property taxes"
          value={centsOf(form, 'personalPropertyTax')}
          onCommit={(v) => setValue('personalPropertyTax', v)}
        />
        <DerivedLine
          no="5e"
          label="Total taxes (SALT cap applied)"
          value={derived.saltDeduction ?? null}
          nodeId="scheduleA:saltDeduction"
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection title="Interest & medical">
        <MoneyLine
          label="Medical and dental expenses"
          value={centsOf(form, 'medical')}
          onCommit={(v) => setValue('medical', v)}
        />
        <MoneyLine
          no="8a"
          label="Home mortgage interest"
          value={centsOf(form, 'mortgageInterest')}
          onCommit={(v) => setValue('mortgageInterest', v)}
        />
      </FormSection>

      <FormSection title="Gifts to charity">
        <MoneyLine
          no="11"
          label="By cash or check"
          value={centsOf(form, 'charitableCash')}
          onCommit={(v) => setValue('charitableCash', v)}
        />
        <MoneyLine
          no="12"
          label="Other than by cash or check"
          value={centsOf(form, 'charitableNonCash')}
          onCommit={(v) => setValue('charitableNonCash', v)}
        />
      </FormSection>

      <FormSection>
        <DerivedLine
          no="17"
          label="Total itemized deductions"
          value={derived.total ?? null}
          nodeId="scheduleA:total"
          onTrace={onTrace}
        />
      </FormSection>
    </FormFrame>
  )
}
