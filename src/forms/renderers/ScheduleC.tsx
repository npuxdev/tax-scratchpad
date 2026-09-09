import type { Federal2025Result } from '../../tax/types'
import { BooleanLine, DerivedLine, FormFrame, FormSection, MoneyLine, TextLine } from './parts'
import { boolOf, centsOf, textOf, type InputRendererProps } from './types'

interface ScheduleCProps extends InputRendererProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

const EXPENSE_FIELDS: Array<{ id: string; label: string }> = [
  { id: 'advertising', label: 'Advertising' },
  { id: 'carAndTruck', label: 'Car and truck expenses' },
  { id: 'commissions', label: 'Commissions and fees' },
  { id: 'contractLabor', label: 'Contract labor' },
  { id: 'insurance', label: 'Insurance (other than health)' },
  { id: 'legal', label: 'Legal and professional services' },
  { id: 'office', label: 'Office expense' },
  { id: 'supplies', label: 'Supplies' },
  { id: 'travel', label: 'Travel' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'wages', label: 'Wages' },
  { id: 'businessMeals', label: 'Business meals (50% deductible)' },
  { id: 'otherExpenses', label: 'Other expenses' },
]

export function ScheduleC({ form, setValue, calculation, onTrace }: ScheduleCProps) {
  const derived = calculation?.forms.scheduleC[form.id] ?? {}

  return (
    <FormFrame title="Schedule C" meta="Profit or Loss From Business · 2025">
      <FormSection>
        <TextLine
          fieldId="businessName"
          label="Business name"
          value={textOf(form, 'businessName')}
          onCommit={(v) => setValue('businessName', v)}
        />
      </FormSection>

      <FormSection title="Part I · Income">
        <MoneyLine
          fieldId="otherGrossReceipts"
          no="1"
          label="Other gross receipts (not from 1099-NEC)"
          value={centsOf(form, 'otherGrossReceipts')}
          onCommit={(v) => setValue('otherGrossReceipts', v)}
        />
        <MoneyLine
          fieldId="returnsAndAllowances"
          no="2"
          label="Returns and allowances"
          value={centsOf(form, 'returnsAndAllowances')}
          onCommit={(v) => setValue('returnsAndAllowances', v)}
        />
        <MoneyLine
          fieldId="costOfGoodsSold"
          no="4"
          label="Cost of goods sold"
          value={centsOf(form, 'costOfGoodsSold')}
          onCommit={(v) => setValue('costOfGoodsSold', v)}
        />
        <DerivedLine
          no="7"
          label="Gross income"
          value={derived.grossReceipts ?? null}
          nodeId={`scheduleC:${form.id}:gross`}
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection title="Part II · Expenses">
        {EXPENSE_FIELDS.map((f) => (
          <MoneyLine
            key={f.id}
            fieldId={f.id}
            label={f.label}
            value={centsOf(form, f.id)}
            onCommit={(v) => setValue(f.id, v)}
          />
        ))}
        <BooleanLine
          fieldId="hasDepreciation"
          label="Depreciation / Form 4562 applies"
          value={boolOf(form, 'hasDepreciation')}
          onCommit={(v) => setValue('hasDepreciation', v)}
        />
        <BooleanLine
          fieldId="hasHomeOffice"
          label="Home office deduction applies"
          value={boolOf(form, 'hasHomeOffice')}
          onCommit={(v) => setValue('hasHomeOffice', v)}
        />
        <DerivedLine
          no="28"
          label="Total expenses"
          value={derived.totalExpenses ?? null}
          nodeId={`scheduleC:${form.id}:expenses`}
          onTrace={onTrace}
        />
      </FormSection>

      <FormSection>
        <DerivedLine
          no="31"
          label="Net profit or (loss)"
          value={derived.netProfit ?? null}
          nodeId={`scheduleC:${form.id}:net`}
          onTrace={onTrace}
        />
      </FormSection>
    </FormFrame>
  )
}
