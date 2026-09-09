import type { Federal2025Result } from '../../tax/types'
import { DerivedRecord, FormFrame } from './parts'

interface DerivedProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function Schedule2({ calculation, onTrace }: DerivedProps) {
  return (
    <FormFrame title="Schedule 2" meta="Additional Taxes · 2025">
      <DerivedRecord
        record={calculation?.forms.schedule2 ?? {}}
        keyPrefix="schedule2"
        onTrace={onTrace}
      />
    </FormFrame>
  )
}
