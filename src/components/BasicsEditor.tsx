import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { FILING_STATUS_OPTIONS } from '../app/labels'
import { money } from '../tax/money'
import { createId } from '../state/scenario'
import type { Dependent, FilingStatus } from '../tax/types'

function MoneyField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (cents: number) => void
}) {
  const [draft, setDraft] = useState(String(money.toDollars(value)))
  useEffect(() => {
    setDraft(String(money.toDollars(value)))
  }, [value])
  const commit = () => {
    const cents = money.parse(draft)
    onCommit(cents ?? money.zero)
  }
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        plain
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
        }}
      />
    </Field>
  )
}

function emptyDependent(): Dependent {
  return {
    id: createId(),
    name: '',
    relationship: 'child',
    ageAtEndOf2025: 0,
    livedWithTaxpayerMoreThanHalfYear: true,
    providedMoreThanHalfOwnSupport: false,
    claimedAsDependent: true,
    citizenNationalOrResidentAlien: true,
    validEmploymentSSN: true,
  }
}

export function BasicsEditor() {
  const { activeScenario, dispatch } = useAppStore()
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null)
  const [isNew, setIsNew] = useState(false)

  if (!activeScenario) return null
  const { basics, dependents, estimatedPayments } = activeScenario
  const isJoint = basics.filingStatus === 'married_joint'

  const openAdd = () => {
    setEditingDependent(emptyDependent())
    setIsNew(true)
  }
  const openEdit = (dep: Dependent) => {
    setEditingDependent({ ...dep })
    setIsNew(false)
  }
  const saveDependent = () => {
    if (!editingDependent) return
    if (isNew) {
      dispatch({ type: 'ADD_DEPENDENT', dependent: editingDependent })
    } else {
      const { id, ...patch } = editingDependent
      dispatch({ type: 'UPDATE_DEPENDENT', id, patch })
    }
    setEditingDependent(null)
  }

  return (
    <div className="scratchpad">
      <section className="scratchpad__section">
        <div className="scratchpad__section-head">
          <span className="scratchpad__section-title">Filing</span>
        </div>
        <div className="stack" style={{ paddingTop: 10 }}>
          <Field>
            <FieldLabel>Filing status</FieldLabel>
            <Select
              options={FILING_STATUS_OPTIONS}
              value={basics.filingStatus}
              onValueChange={(v) =>
                dispatch({ type: 'SET_FILING_STATUS', filingStatus: v as FilingStatus })
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="tp-name">Taxpayer name</FieldLabel>
            <Input
              id="tp-name"
              plain
              value={basics.taxpayerName ?? ''}
              onChange={(e) =>
                dispatch({ type: 'SET_BASICS', patch: { taxpayerName: e.target.value } })
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="tp-age">Taxpayer age at end of 2025</FieldLabel>
            <Input
              id="tp-age"
              plain
              inputMode="numeric"
              value={String(basics.taxpayerAgeAtEndOfYear)}
              onChange={(e) =>
                dispatch({
                  type: 'SET_BASICS',
                  patch: { taxpayerAgeAtEndOfYear: Number(e.target.value) || 0 },
                })
              }
            />
          </Field>

          <label className="check-row">
            <input
              type="checkbox"
              checked={basics.taxpayerBlind}
              onChange={(e) =>
                dispatch({ type: 'SET_BASICS', patch: { taxpayerBlind: e.target.checked } })
              }
            />
            Taxpayer is blind
          </label>

          {isJoint ? (
            <>
              <Field>
                <FieldLabel htmlFor="sp-name">Spouse name</FieldLabel>
                <Input
                  id="sp-name"
                  plain
                  value={basics.spouseName ?? ''}
                  onChange={(e) =>
                    dispatch({ type: 'SET_BASICS', patch: { spouseName: e.target.value } })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sp-age">Spouse age at end of 2025</FieldLabel>
                <Input
                  id="sp-age"
                  plain
                  inputMode="numeric"
                  value={String(basics.spouseAgeAtEndOfYear ?? 0)}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_BASICS',
                      patch: { spouseAgeAtEndOfYear: Number(e.target.value) || 0 },
                    })
                  }
                />
              </Field>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={basics.spouseBlind}
                  onChange={(e) =>
                    dispatch({ type: 'SET_BASICS', patch: { spouseBlind: e.target.checked } })
                  }
                />
                Spouse is blind
              </label>
            </>
          ) : null}
        </div>
      </section>

      <section className="scratchpad__section">
        <div className="scratchpad__section-head">
          <span className="scratchpad__section-title">Payments</span>
        </div>
        <div className="stack" style={{ paddingTop: 10 }}>
          <MoneyField
            label="Estimated payments"
            value={estimatedPayments}
            onCommit={(cents) =>
              dispatch({ type: 'SET_ESTIMATED_PAYMENTS', amount: cents })
            }
          />
        </div>
      </section>

      <section className="scratchpad__section">
        <div className="scratchpad__section-head">
          <span className="scratchpad__section-title">Dependents</span>
          <Button variant="ghost" size="sm" onClick={openAdd}>
            + Add dependent
          </Button>
        </div>
        {dependents.length === 0 ? (
          <p className="muted" style={{ padding: '8px 0', fontSize: '0.8125rem' }}>
            No dependents.
          </p>
        ) : (
          <ul className="dep-list">
            {dependents.map((dep) => (
              <li className="dep-item" key={dep.id}>
                <div>
                  <div style={{ fontSize: '0.8125rem' }}>
                    {dep.name || 'Unnamed dependent'}
                  </div>
                  <div className="muted" style={{ fontSize: '0.6875rem' }}>
                    {dep.relationship} · age {dep.ageAtEndOf2025}
                  </div>
                </div>
                <div className="row">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dep)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'REMOVE_DEPENDENT', id: dep.id })}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        className="app-dialog"
        open={editingDependent !== null}
        onClose={() => setEditingDependent(null)}
        dismissable
        lightDismiss
        closeLabel="Close"
      >
        <DialogTitle>{isNew ? 'Add dependent' : 'Edit dependent'}</DialogTitle>
        <DialogBody>
          {editingDependent ? (
            <div className="stack">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  plain
                  autoFocus
                  value={editingDependent.name ?? ''}
                  onChange={(e) =>
                    setEditingDependent({ ...editingDependent, name: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Relationship</FieldLabel>
                <Input
                  plain
                  value={editingDependent.relationship}
                  onChange={(e) =>
                    setEditingDependent({
                      ...editingDependent,
                      relationship: e.target.value,
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Age at end of 2025</FieldLabel>
                <Input
                  plain
                  inputMode="numeric"
                  value={String(editingDependent.ageAtEndOf2025)}
                  onChange={(e) =>
                    setEditingDependent({
                      ...editingDependent,
                      ageAtEndOf2025: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={editingDependent.livedWithTaxpayerMoreThanHalfYear}
                  onChange={(e) =>
                    setEditingDependent({
                      ...editingDependent,
                      livedWithTaxpayerMoreThanHalfYear: e.target.checked,
                    })
                  }
                />
                Lived with taxpayer more than half the year
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={editingDependent.claimedAsDependent}
                  onChange={(e) =>
                    setEditingDependent({
                      ...editingDependent,
                      claimedAsDependent: e.target.checked,
                    })
                  }
                />
                Claimed as a dependent
              </label>
            </div>
          ) : null}
        </DialogBody>
        <DialogActions>
          <Button variant="ghost" onClick={() => setEditingDependent(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveDependent}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
