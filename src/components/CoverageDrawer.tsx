import {
  Button,
  Drawer,
  DrawerBody,
  DrawerTitle,
  Empty,
} from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'

export function CoverageDrawer() {
  const { calculation, setSelectedFormId, setMainView } = useAppStore()
  const { coverageDrawerOpen, setCoverageDrawerOpen } = useUiState()

  const issues = calculation?.coverage.issues ?? []
  const status = calculation?.coverage.status ?? 'exact'

  const close = () => setCoverageDrawerOpen(false)

  return (
    <Drawer
      open={coverageDrawerOpen}
      onClose={close}
      dismissable
      lightDismiss
      closeLabel="Close"
    >
      <DrawerTitle>Projection coverage</DrawerTitle>
      <DrawerBody>
        {status === 'exact' && issues.length === 0 ? (
          <Empty title="Fully covered">
            Every entered value is supported by the 2025 rule set. The projection
            is exact.
          </Empty>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              The refund or amount due is hidden while any input is outside the
              supported rule set.
            </p>
            <ul className="coverage-list">
              {issues.map((issue) => (
                <li className="coverage-item" key={issue.id}>
                  <div className="coverage-item__status">
                    {issue.status === 'unsupported' ? 'Unsupported' : 'Needs input'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', margin: '2px 0 6px' }}>
                    {issue.message}
                  </div>
                  {issue.formId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFormId(issue.formId!)
                        setMainView('form')
                        close()
                      }}
                    >
                      Go to form
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </DrawerBody>
    </Drawer>
  )
}
