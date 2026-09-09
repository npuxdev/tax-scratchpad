import {
  Button,
  Drawer,
  DrawerBody,
  DrawerTitle,
  Separator,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { getAncestors, getDescendants, getNode } from '../tax/graph'
import { money } from '../tax/money'

/** Map a node destination form key to a packet selection id. */
function destinationToSelection(form: string): string | null {
  const key = form.trim().toLowerCase()
  switch (key) {
    case '1040':
    case 'form 1040':
      return 'calc:1040'
    case 'schedule1':
    case 'schedule 1':
    case 'schedule_1':
      return 'calc:schedule1'
    case 'schedule2':
    case 'schedule 2':
    case 'schedule_2':
      return 'calc:schedule2'
    case 'schedulese':
    case 'schedule se':
    case 'schedule_se':
      return 'calc:scheduleSE'
    case 'schedule8812':
    case 'schedule 8812':
    case 'schedule_8812':
      return 'calc:schedule8812'
    case 'schedulec':
    case 'schedule c':
    case 'schedule_c':
      // Caller should prefer form instance id; fall back to packet via store.
      return null
    case 'schedulea':
    case 'schedule a':
    case 'schedule_a':
      return null
    default:
      return null
  }
}

export function CalculationTrace() {
  const {
    activeScenario,
    calculation,
    setSelectedFormId,
    setMainView,
  } = useAppStore()
  const { traceTarget, closeTrace, openTrace } = useUiState()

  const graph = calculation?.graph ?? { nodes: {} }
  const node = traceTarget ? getNode(graph, traceTarget.nodeId) : undefined
  const ancestors = traceTarget ? getAncestors(graph, traceTarget.nodeId) : []
  const descendants = traceTarget
    ? getDescendants(graph, traceTarget.nodeId).map((id) => getNode(graph, id))
    : []

  const goToForm = (form: string) => {
    const key = form.trim().toLowerCase()
    if (key === 'schedule c' || key === 'schedulec' || key === 'schedule_c') {
      const scheduleC = activeScenario?.forms.find((f) => f.type === 'SCHEDULE_C')
      if (scheduleC) {
        setSelectedFormId(scheduleC.id)
        setMainView('form')
        closeTrace()
      }
      return
    }
    if (key === 'schedule a' || key === 'schedulea' || key === 'schedule_a') {
      const scheduleA = activeScenario?.forms.find((f) => f.type === 'SCHEDULE_A')
      if (scheduleA) {
        setSelectedFormId(scheduleA.id)
        setMainView('form')
        closeTrace()
      }
      return
    }
    const sel = destinationToSelection(form)
    if (sel) {
      setSelectedFormId(sel)
      setMainView('form')
      closeTrace()
    }
  }

  return (
    <Drawer
      open={traceTarget !== null}
      onClose={closeTrace}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DrawerTitle>{node?.label ?? 'Calculation trace'}</DrawerTitle>
      <DrawerBody>
        {!node ? (
          <p className="muted">
            No calculation trace is available for this line.
          </p>
        ) : (
          <div className="stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="muted">Value</span>
              <span className="tabular" style={{ fontWeight: 600 }}>
                {node.value === null ? '—' : money.format(node.value)}
              </span>
            </div>

            {node.detail || node.rule ? (
              <p className="muted">{node.detail ?? node.rule}</p>
            ) : null}

            {node.destination ? (
              <div className="trace-links">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToForm(node.destination!.form)}
                >
                  → {node.destination.form} · {node.destination.line}
                </Button>
              </div>
            ) : null}

            {node.children && node.children.length > 0 ? (
              <div>
                <Separator />
                <p className="scratchpad__section-title" style={{ paddingLeft: 0 }}>
                  Breakdown
                </p>
                <ul className="trace-children">
                  {node.children.map((child, i) => (
                    <li className="trace-child" key={`${child.label}-${i}`}>
                      {child.nodeId ? (
                        <button
                          type="button"
                          className="footer__incomplete"
                          onClick={() => openTrace(child.nodeId!)}
                        >
                          {child.label}
                        </button>
                      ) : (
                        <span>{child.label}</span>
                      )}
                      <span className="tabular">{money.format(child.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {ancestors.length > 0 ? (
              <div>
                <Separator />
                <p className="scratchpad__section-title" style={{ paddingLeft: 0 }}>
                  Sources
                </p>
                <div className="trace-links">
                  {ancestors.map((a) => (
                    <Button
                      key={a.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => openTrace(a.id)}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {descendants.length > 0 ? (
              <div>
                <Separator />
                <p className="scratchpad__section-title" style={{ paddingLeft: 0 }}>
                  Used by
                </p>
                <div className="trace-links">
                  {descendants.map((d) =>
                    d ? (
                      <Button
                        key={d.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => openTrace(d.id)}
                      >
                        {d.label}
                      </Button>
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DrawerBody>
    </Drawer>
  )
}
