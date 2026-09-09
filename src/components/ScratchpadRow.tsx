import { Input } from '@noorddev/vlak-react'
import type { FieldDataType, FieldValue } from '../tax/types'
import { formatFieldValue } from '../forms/fieldEditing'

export type RowStatus = 'counted' | 'noted' | 'blocking'

export interface ScratchRow {
  key: string
  formId: string
  fieldId: string
  label: string
  box?: string
  dataType: FieldDataType
  value: FieldValue
  destination?: string
  status: RowStatus
  editable: boolean
}

const STATUS_LABEL: Record<RowStatus, string> = {
  counted: 'Counted',
  noted: 'Noted',
  blocking: 'Blocks',
}

interface ScratchpadRowProps {
  row: ScratchRow
  index: number
  selected: boolean
  editing: boolean
  editValue: string
  editError: string | null
  registerRef: (index: number, el: HTMLDivElement | null) => void
  onSelect: (index: number) => void
  onStartEdit: (index: number) => void
  onEditChange: (value: string) => void
}

export function ScratchpadRow({
  row,
  index,
  selected,
  editing,
  editValue,
  editError,
  registerRef,
  onSelect,
  onStartEdit,
  onEditChange,
}: ScratchpadRowProps) {
  const displayValue = formatFieldValue(row.value, row.dataType)
  const isEmpty = displayValue === '—' || displayValue === 'No'

  return (
    <div
      className="scratchrow"
      role="option"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      ref={(el) => registerRef(index, el)}
      onClick={() => onSelect(index)}
    >
      <div className="scratchrow__label">
        {row.box ? <span className="scratchrow__box">Box {row.box}</span> : null}
        {row.label}
      </div>

      {editing ? (
        <div className="scratchrow__edit">
          <Input
            plain
            autoFocus
            value={editValue}
            error={editError ?? undefined}
            inputMode={
              row.dataType === 'money' || row.dataType === 'number'
                ? 'decimal'
                : undefined
            }
            onChange={(e) => onEditChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`scratchrow__value${
              isEmpty ? ' scratchrow__value--empty' : ''
            }${row.editable ? '' : ' scratchrow__value--readonly'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (row.editable) onStartEdit(index)
              else onSelect(index)
            }}
          >
            {displayValue}
          </button>
          <span className="scratchrow__dest">
            {row.destination ? `→ ${row.destination}` : ''}
          </span>
          <span className={`scratchrow__status scratchrow__status--${row.status}`}>
            {STATUS_LABEL[row.status]}
          </span>
        </>
      )}
    </div>
  )
}
