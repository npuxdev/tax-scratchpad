import type { Federal2025Result } from '../../tax/types'
import { DerivedRecord, FormFrame } from './parts'

interface DerivedProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function Schedule1({ calculation, onTrace }: DerivedProps) {
  return (
    <FormFrame title="Schedule 1" meta="Additional Income and Adjustments · 2025">
      <DerivedRecord
        record={calculation?.forms.schedule1 ?? {}}
        keyPrefix="schedule1"
        onTrace={onTrace}
      />
    </FormFrame>
  )
}
