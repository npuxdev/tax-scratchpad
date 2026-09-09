import { useEffect, useState, type ReactNode } from 'react'
import { Input } from '@noorddev/vlak-react'
import { money } from '../../tax/money'
import type { Cents, FieldDataType } from '../../tax/types'
import { formatFieldValue } from '../fieldEditing'
import { resolveDerivedLine } from '../derivedLines'

export function FormFrame({
  title,
  meta,
  children,
}: {
  title: string
  meta: string
  children: ReactNode
}) {
  return (
    <div className="tax-form">
      <div className="tax-form__header">
        <span className="tax-form__title">{title}</span>
        <span className="tax-form__meta">{meta}</span>
      </div>
      {children}
    </div>
  )
}

export function FormSection({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="tax-form__section">
      {title ? <div className="tax-form__section-title">{title}</div> : null}
      {children}
    </div>
  )
}

export function MoneyLine({
  no,
  label,
  value,
  onCommit,
}: {
  no?: string
  label: string
  value: Cents
  onCommit: (cents: Cents) => void
}) {
  const [draft, setDraft] = useState(String(money.toDollars(value)))
  useEffect(() => setDraft(String(money.toDollars(value))), [value])
  const commit = () => {
    const cents = money.parse(draft)
    onCommit(cents ?? money.zero)
  }
  return (
    <div className="tax-line">
      <span className="tax-line__no">{no ?? ''}</span>
      <span className="tax-line__label">{label}</span>
      <span className="tax-line__value">
        <Input
          plain
          inputMode="decimal"
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
      </span>
    </div>
  )
}

export function TextLine({
  no,
  label,
  value,
  onCommit,
}: {
  no?: string
  label: string
  value: string
  onCommit: (value: string) => void
}) {
  return (
    <div className="tax-line">
      <span className="tax-line__no">{no ?? ''}</span>
      <span className="tax-line__label">{label}</span>
      <span className="tax-line__value">
        <Input
          plain
          aria-label={label}
          value={value}
          onChange={(e) => onCommit(e.target.value)}
        />
      </span>
    </div>
  )
}

export function BooleanLine({
  no,
  label,
  value,
  onCommit,
}: {
  no?: string
  label: string
  value: boolean
  onCommit: (value: boolean) => void
}) {
  return (
    <div className="tax-line">
      <span className="tax-line__no">{no ?? ''}</span>
      <span className="tax-line__label">{label}</span>
      <span className="tax-line__value">
        <label className="check-row" style={{ justifyContent: 'flex-end' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onCommit(e.target.checked)}
          />
        </label>
      </span>
    </div>
  )
}

/**
 * Renders a derived-form record (line-id → cents) as read-only lines.
 * Shows a quiet note when the calculation has not populated any lines yet.
 */
export function DerivedRecord({
  record,
  keyPrefix,
  onTrace,
}: {
  record: Record<string, number | string | null>
  keyPrefix: string
  onTrace: (nodeId: string) => void
}) {
  const entries = Object.entries(record)
  if (entries.length === 0) {
    return (
      <FormSection>
        <div className="tax-line">
          <span className="tax-line__no" />
          <span className="tax-line__label muted">
            No amounts yet — enter inputs to populate this schedule.
          </span>
          <span className="tax-line__value" />
        </div>
      </FormSection>
    )
  }
  return (
    <FormSection>
      {entries.map(([line, value]) => {
        const meta = resolveDerivedLine(keyPrefix, line)
        const numeric = typeof value === 'number' ? value : null
        return (
          <DerivedLine
            key={line}
            no={meta.no}
            label={meta.label}
            value={numeric}
            dataType={meta.dataType}
            nodeId={meta.nodeId}
            onTrace={onTrace}
          />
        )
      })}
    </FormSection>
  )
}

/** Read-only derived line. Clicking the value opens the calculation trace. */
export function DerivedLine({
  no,
  label,
  value,
  dataType = 'money',
  nodeId,
  onTrace,
}: {
  no?: string
  label: string
  value: Cents | null | undefined
  dataType?: FieldDataType
  nodeId?: string
  onTrace?: (nodeId: string) => void
}) {
  const display = formatFieldValue(value ?? null, dataType)
  const isEmpty = display === '—'
  return (
    <div className="tax-line tax-line--derived">
      <span className="tax-line__no">{no ?? ''}</span>
      <span className="tax-line__label">{label}</span>
      <span className={`tax-line__value${isEmpty ? ' tax-line__value--empty' : ''}`}>
        {nodeId && onTrace ? (
          <button type="button" onClick={() => onTrace(nodeId)}>
            {display}
          </button>
        ) : (
          display
        )}
      </span>
    </div>
  )
}
