import type { Federal2025Result, TaxScenario } from '../../tax/types'
import { DerivedLine, FormFrame, FormSection } from './parts'

interface Form1040Props {
  scenario: TaxScenario
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function Form1040({ scenario, calculation, onTrace }: Form1040Props) {
  const t = calculation?.totals
  const filing = scenario.basics.filingStatus
  const deductionType =
    t?.deductionType === 'itemized' ? 'Itemized' : 'Standard'

  return (
    <FormFrame title="Form 1040" meta="U.S. Individual Income Tax Return · 2025">
      <FormSection title={`Filing status · ${filing.replace(/_/g, ' ')}`}>
        <DerivedLine
          no="9"
          label="Total income"
          value={t?.income ?? null}
          nodeId="1040.9"
          onTrace={onTrace}
        />
        <DerivedLine
          no="10"
          label="Adjustments to income"
          value={t?.adjustments ?? null}
          nodeId="1040.10"
          onTrace={onTrace}
        />
        <DerivedLine
          no="11"
          label="Adjusted gross income"
          value={t?.agi ?? null}
          nodeId="1040.11"
          onTrace={onTrace}
        />
        <DerivedLine
          no="12"
          label={`Deduction (${deductionType})`}
          value={t?.deductions ?? null}
          nodeId="1040.12"
          onTrace={onTrace}
        />
        <DerivedLine
          no="15"
          label="Taxable income"
          value={t?.taxableIncome ?? null}
          nodeId="1040.15"
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection title="Tax and credits">
        <DerivedLine
          no="16"
          label="Tax"
          value={t?.incomeTax ?? null}
          nodeId="1040.16"
          onTrace={onTrace}
        />
        <DerivedLine
          no="19"
          label="Child tax credit / credit for other dependents"
          value={t?.nonrefundableCredits ?? null}
          nodeId="1040.19"
          onTrace={onTrace}
        />
        <DerivedLine
          no="23"
          label="Other taxes (Schedule 2)"
          value={
            t ? t.selfEmploymentTax + t.additionalMedicareTax : null
          }
          nodeId="1040.23"
          onTrace={onTrace}
        />
        <DerivedLine
          no="24"
          label="Total tax"
          value={t?.totalTax ?? null}
          nodeId="1040.24"
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection title="Payments">
        <DerivedLine
          no="25"
          label="Federal income tax withheld"
          value={t?.withholding ?? null}
          nodeId="1040.25"
          onTrace={onTrace}
        />
        <DerivedLine
          no="26"
          label="Estimated tax payments"
          value={t?.estimatedPayments ?? null}
          nodeId="1040.26"
          onTrace={onTrace}
        />
        <DerivedLine
          no="33"
          label="Total payments"
          value={t?.totalPayments ?? null}
          nodeId="1040.33"
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection title="Refund or amount you owe">
        <DerivedLine
          no="34/37"
          label={
            (t?.refundOrDue ?? 0) >= 0 ? 'Refund' : 'Amount you owe'
          }
          value={t ? Math.abs(t.refundOrDue) : null}
          nodeId="1040.refundOrDue"
          onTrace={onTrace}
        />
      </FormSection>
    </FormFrame>
  )
}
