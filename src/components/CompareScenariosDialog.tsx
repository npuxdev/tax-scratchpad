import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
  Empty,
  toast,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { downloadJsonFile } from '../app/scenarioIo'
import { money } from '../tax/money'
import {
  compareScenarios,
  comparisonDownloadName,
  exportComparisonJson,
  formatComparisonValue,
  formatOutcome,
  formatOutcomeDelta,
  moneyDelta,
} from '../comparison/compare'
import type { ComparisonRow, ScenarioComparisonDocument } from '../comparison/types'
import type { TaxScenario } from '../tax/types'

function initialSelection(
  scenarios: TaxScenario[],
  activeScenarioId: string | null,
): string[] {
  if (scenarios.length <= 2) return scenarios.map((scenario) => scenario.id)
  if (activeScenarioId && scenarios.some((scenario) => scenario.id === activeScenarioId)) {
    return [activeScenarioId]
  }
  return scenarios[0] ? [scenarios[0].id] : []
}

function orderSelected(
  scenarios: TaxScenario[],
  selectedIds: string[],
  activeScenarioId: string | null,
): TaxScenario[] {
  const picked = scenarios.filter((scenario) => selectedIds.includes(scenario.id))
  if (!activeScenarioId) return picked
  const active = picked.find((scenario) => scenario.id === activeScenarioId)
  if (!active) return picked
  return [active, ...picked.filter((scenario) => scenario.id !== activeScenarioId)]
}

function groupRows(rows: ComparisonRow[]): Array<[string, ComparisonRow[]]> {
  const groups: Array<[string, ComparisonRow[]]> = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last[0] === row.group) {
      last[1].push(row)
    } else {
      groups.push([row.group, [row]])
    }
  }
  return groups
}

export function CompareScenariosDialog() {
  const { scenarios, activeScenarioId } = useAppStore()
  const { compareOpen, setCompareOpen } = useUiState()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!compareOpen) return
    setSelectedIds(initialSelection(scenarios, activeScenarioId))
  }, [compareOpen, scenarios, activeScenarioId])

  const selectedScenarios = useMemo(
    () => orderSelected(scenarios, selectedIds, activeScenarioId),
    [scenarios, selectedIds, activeScenarioId],
  )

  const comparison = useMemo(
    () =>
      selectedScenarios.length >= 2
        ? compareScenarios(selectedScenarios)
        : null,
    [selectedScenarios],
  )

  const close = () => setCompareOpen(false)

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleExport = () => {
    if (!comparison) return
    downloadJsonFile(
      comparisonDownloadName(comparison),
      exportComparisonJson(comparison),
    )
    toast('Exported comparison JSON')
  }

  const canCompare = scenarios.length >= 2

  return (
    <Dialog
      className="app-dialog app-dialog--compare"
      open={compareOpen}
      onClose={close}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DialogTitle>Compare scenarios</DialogTitle>
      <DialogBody>
        {canCompare
          ? 'Select two or more. The table only lists inputs and calculations that differ.'
          : 'Duplicate this scenario or start another to compare side by side.'}
      </DialogBody>

      {canCompare ? (
        <div className="compare">
          <div className="compare__picker" role="group" aria-label="Scenarios to compare">
            {scenarios.map((scenario) => (
              <Checkbox
                key={scenario.id}
                label={scenario.name}
                checked={selectedIds.includes(scenario.id)}
                onChange={() => toggle(scenario.id)}
              />
            ))}
          </div>

          {comparison ? (
            <ComparisonView comparison={comparison} />
          ) : (
            <Empty title="Select at least two scenarios">
              Tick another scenario to see what changed.
            </Empty>
          )}
        </div>
      ) : null}

      <DialogActions>
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
        <Button
          variant="primary"
          disabled={!comparison}
          onClick={handleExport}
        >
          Export JSON
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ComparisonView({
  comparison,
}: {
  comparison: ScenarioComparisonDocument
}) {
  const { scenarios, calculations, inputs, summary } = comparison

  return (
    <div className="compare__result">
      <div
        className="compare__outcomes"
        style={{ ['--cmp-cols' as string]: String(scenarios.length) }}
      >
        {scenarios.map((scenario, index) => {
          const exact = scenario.coverage === 'exact'
          const baseline = scenarios[0]!
          const deltaPhrase =
            index === 0 || !exact || baseline.coverage !== 'exact'
              ? null
              : formatOutcomeDelta(
                  baseline.totals.refundOrDue,
                  scenario.totals.refundOrDue,
                )
          return (
            <article
              key={scenario.id}
              className={`compare__outcome${index === 0 ? ' compare__outcome--baseline' : ''}`}
            >
              <div className="compare__outcome-name">
                {scenario.name}
                {index === 0 ? ' · Baseline' : ''}
              </div>
              <div className="compare__outcome-figure tabular">
                {formatOutcome(scenario.totals.refundOrDue, exact)}
              </div>
              {index === 0 ? (
                <div className="compare__outcome-delta">Baseline</div>
              ) : deltaPhrase ? (
                <div className="compare__outcome-delta tabular">{deltaPhrase}</div>
              ) : (
                <div className="compare__outcome-delta">
                  {exact ? 'Calculation complete' : 'Calculation incomplete'}
                </div>
              )}
              <OutcomeBar
                value={exact ? scenario.totals.refundOrDue : null}
                peers={scenarios.map((peer) =>
                  peer.coverage === 'exact' ? peer.totals.refundOrDue : null,
                )}
              />
            </article>
          )
        })}
      </div>

      <p className="compare__summary muted">
        {summary.identical
          ? 'Inputs and calculations match.'
          : `${summary.calculationCount} calculation difference${summary.calculationCount === 1 ? '' : 's'} · ${summary.inputCount} input difference${summary.inputCount === 1 ? '' : 's'}`}
      </p>

      {calculations.length > 0 ? (
        <DiffTable
          title="Calculations"
          rows={calculations}
          scenarios={scenarios}
        />
      ) : null}

      {inputs.length > 0 ? (
        <DiffTable title="Inputs" rows={inputs} scenarios={scenarios} />
      ) : null}
    </div>
  )
}

function OutcomeBar({
  value,
  peers,
}: {
  value: number | null
  peers: Array<number | null>
}) {
  const magnitudes = peers
    .filter((peer): peer is number => peer !== null)
    .map((peer) => Math.abs(peer))
  const max = Math.max(0, ...magnitudes)
  if (value === null || max === 0) {
    return <div className="compare__bar" aria-hidden="true" />
  }
  const width = Math.max(6, (Math.abs(value) / max) * 100)
  return (
    <div className="compare__bar" aria-hidden="true">
      <div
        className={`compare__bar-fill${value < 0 ? ' compare__bar-fill--due' : ''}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

function DiffTable({
  title,
  rows,
  scenarios,
}: {
  title: string
  rows: ComparisonRow[]
  scenarios: ScenarioComparisonDocument['scenarios']
}) {
  const groups = groupRows(rows)
  const colCount = scenarios.length + 1

  return (
    <section className="compare__section">
      <h3 className="compare__section-title">{title}</h3>
      <div className="compare__table-wrap">
        <table className="compare__table">
          <thead>
            <tr>
              <th scope="col">Line</th>
              {scenarios.map((scenario, index) => (
                <th key={scenario.id} scope="col">
                  {scenario.name}
                  {index === 0 ? ' · Baseline' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([group, groupRows]) => (
              <GroupRows
                key={group}
                group={group}
                rows={groupRows}
                colCount={colCount}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GroupRows({
  group,
  rows,
  colCount,
}: {
  group: string
  rows: ComparisonRow[]
  colCount: number
}) {
  return (
    <>
      <tr className="compare__group">
        <th scope="colgroup" colSpan={colCount}>
          {group}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.id}>
          <th scope="row">{row.label}</th>
          {row.values.map((_, index) => {
            const display = formatComparisonValue(row, index)
            const delta = moneyDelta(row, index)
            const differs =
              formatComparisonValue(row, 0) !== display ||
              (row.values[index] === null && row.values[0] !== null)
            return (
              <td
                key={`${row.id}:${index}`}
                className={differs && index > 0 ? 'compare__cell--diff' : undefined}
              >
                <span className="compare__stack">
                  <span className="tabular">{display}</span>
                  {delta !== null ? (
                    <span className="compare__delta tabular">
                      {money.format(delta, { signed: true })}
                    </span>
                  ) : null}
                </span>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
