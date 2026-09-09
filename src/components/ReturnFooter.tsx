import { DropdownMenu } from './DropdownMenu'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { money } from '../tax/money'
import { FORM_TYPE_LABELS } from '../app/labels'

export function ReturnFooter() {
  const { activeScenario, calculation, setSelectedFormId, setMainView } =
    useAppStore()
  const { setCoverageDrawerOpen, setPacketDrawerOpen } = useUiState()

  if (!activeScenario || !calculation) return null

  const { coverage, totals } = calculation
  const exact = coverage.status === 'exact'
  const formCount = activeScenario.forms.length

  const projection = () => {
    if (!exact) {
      return (
        <button
          type="button"
          className="footer__incomplete"
          onClick={() => setCoverageDrawerOpen(true)}
        >
          Projection incomplete
        </button>
      )
    }
    const refund = totals.refundOrDue >= 0
    return (
      <span
        className={`footer__headline${refund ? ' footer__headline--refund' : ''}`}
      >
        {refund ? 'Refund ' : 'Due '}
        {money.format(Math.abs(totals.refundOrDue))}
      </span>
    )
  }

  const formItems = [
    ...activeScenario.forms.map((f) => ({
      label: `${FORM_TYPE_LABELS[f.type]}${f.label && f.label !== FORM_TYPE_LABELS[f.type] ? ` · ${f.label}` : ''}`,
      onSelect: () => {
        setSelectedFormId(f.id)
        setMainView('form')
      },
    })),
    { separator: true },
    { label: 'Open packet…', onSelect: () => setPacketDrawerOpen(true) },
  ]

  return (
    <footer className="app-footer">
      <div className="footer__forms">
        <DropdownMenu
          side="top"
          label={`${formCount} form${formCount === 1 ? '' : 's'}`}
          items={formItems}
        />
      </div>

      <div className="footer__projection" aria-live="polite">
        {projection()}
      </div>

      <div className="footer__stats tabular">
        <span className="footer__stat">
          Income <strong>{money.format(totals.income)}</strong>
        </span>
        <span className="footer__stat">
          Deductions <strong>{money.format(totals.deductions)}</strong>
        </span>
        <span className="footer__stat">
          {totals.deductionType === 'itemized' ? 'Itemized' : 'Standard'}
        </span>
      </div>
    </footer>
  )
}
