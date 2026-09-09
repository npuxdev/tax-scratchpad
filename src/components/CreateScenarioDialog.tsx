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
import type { FilingStatus } from '../tax/types'
import { FILING_STATUS_OPTIONS } from '../app/labels'
import { useAppStore } from '../state/AppStore'

interface CreateScenarioDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateScenarioDialog({ open, onClose }: CreateScenarioDialogProps) {
  const { createScenario } = useAppStore()
  const [name, setName] = useState('')
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single')

  useEffect(() => {
    if (open) {
      setName('')
      setFilingStatus('single')
    }
  }, [open])

  const submit = () => {
    const trimmed = name.trim() || 'Untitled scenario'
    void createScenario(trimmed, filingStatus)
    onClose()
  }

  return (
    <Dialog
      className="app-dialog"
      open={open}
      onClose={onClose}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DialogTitle>New 2025 federal scenario</DialogTitle>
      <DialogBody>
        <div className="stack">
          <Field>
            <FieldLabel htmlFor="scenario-name">Scenario name</FieldLabel>
            <Input
              id="scenario-name"
              plain
              autoFocus
              value={name}
              placeholder="e.g. Baseline 2025"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </Field>
          <Field>
            <FieldLabel>Filing status</FieldLabel>
            <Select
              options={FILING_STATUS_OPTIONS}
              value={filingStatus}
              onValueChange={(v) => setFilingStatus(v as FilingStatus)}
            />
          </Field>
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit}>
          Start scenario
        </Button>
      </DialogActions>
    </Dialog>
  )
}
