import type { Federal2025Result } from '../../tax/types'
import { DerivedRecord, FormFrame } from './parts'

interface DerivedProps {
  calculation: Federal2025Result | null
  onTrace: (nodeId: string) => void
}

export function Schedule8812({ calculation, onTrace }: DerivedProps) {
  return (
    <FormFrame title="Schedule 8812" meta="Credits for Qualifying Children · 2025">
      <DerivedRecord
        record={calculation?.forms.schedule8812 ?? {}}
        keyPrefix="schedule8812"
        onTrace={onTrace}
      />
    </FormFrame>
  )
}
