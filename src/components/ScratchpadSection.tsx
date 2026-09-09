import { ScratchpadRow, type ScratchRow } from './ScratchpadRow'

export interface SectionModel {
  key: string
  title: string
  meta?: string
  rows: Array<{ row: ScratchRow; index: number }>
}

interface ScratchpadSectionProps {
  section: SectionModel
  selectedIndex: number
  editing: boolean
  editValue: string
  editError: string | null
  registerRef: (index: number, el: HTMLDivElement | null) => void
  onSelect: (index: number) => void
  onStartEdit: (index: number) => void
  onEditChange: (value: string) => void
}

export function ScratchpadSection({
  section,
  selectedIndex,
  editing,
  editValue,
  editError,
  registerRef,
  onSelect,
  onStartEdit,
  onEditChange,
}: ScratchpadSectionProps) {
  return (
    <section className="scratchpad__section">
      <div className="scratchpad__section-head">
        <span className="scratchpad__section-title">{section.title}</span>
        {section.meta ? (
          <span className="scratchpad__section-meta">{section.meta}</span>
        ) : null}
      </div>
      {section.rows.map(({ row, index }) => (
        <ScratchpadRow
          key={row.key}
          row={row}
          index={index}
          selected={selectedIndex === index}
          editing={editing && selectedIndex === index}
          editValue={editValue}
          editError={editError}
          registerRef={registerRef}
          onSelect={onSelect}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
        />
      ))}
    </section>
  )
}
