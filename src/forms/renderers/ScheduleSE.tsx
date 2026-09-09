import type { Federal2025Result } from '../../tax/types'
import { DerivedRecord, FormFrame } from './parts'

interface DerivedProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function ScheduleSE({ calculation, onTrace }: DerivedProps) {
  return (
    <FormFrame title="Schedule SE" meta="Self-Employment Tax · 2025">
      <DerivedRecord
        record={calculation?.forms.scheduleSE ?? {}}
        keyPrefix="scheduleSE"
        onTrace={onTrace}
      />
    </FormFrame>
  )
}
