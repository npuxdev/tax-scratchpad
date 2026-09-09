import {
  Button,
  Drawer,
  DrawerBody,
  DrawerTitle,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@noorddev/vlak-react'
import { useAppStore, type MainView } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { BASICS_SELECTION } from '../app/packet'
import { ScenarioSwitcher } from './ScenarioSwitcher'
import { HeaderActions } from './HeaderActions'
import { ReturnPacket } from './ReturnPacket'
import { ScratchpadView } from './ScratchpadView'
import { FormView } from './FormView'
import { BasicsEditor } from './BasicsEditor'
import { ReturnFooter } from './ReturnFooter'
import { AddFormDialog } from './AddFormDialog'
import { CalculationTrace } from './CalculationTrace'
import { CoverageDrawer } from './CoverageDrawer'
import { CommandPalette } from './CommandPalette'
import { CompareScenariosDialog } from './CompareScenariosDialog'

export function AppShell() {
  const { mainView, setMainView, selectedFormId } = useAppStore()
  const { packetDrawerOpen, setPacketDrawerOpen } = useUiState()
  const showFormScratchpadToggle = selectedFormId !== BASICS_SELECTION

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <Button
            className="rail-trigger"
            variant="ghost"
            size="sm"
            aria-label="Open return packet"
            onClick={() => setPacketDrawerOpen(true)}
          >
            ☰
          </Button>
          <span className="app-brand__name">Tax Scratchpad</span>
          <span className="app-brand__year">2025 · Federal</span>
        </div>

        <div className="app-header__center">
          <ScenarioSwitcher />
        </div>

        <div className="app-header__actions">
          <HeaderActions />
        </div>
      </header>

      <div className="app-body">
        <aside className="app-rail">
          <ReturnPacket />
        </aside>

        <main className="app-main">
          {showFormScratchpadToggle ? (
            <Tabs
              className="app-main__tabs"
              value={mainView}
              onValueChange={(v) => setMainView(v as MainView)}
            >
            <TabList aria-label="Working plane" style={{ padding: '0 16px' }}>
              <Tab value="scratchpad" aria-keyshortcuts="T G+S">
                Scratchpad
              </Tab>
              <Tab value="form" aria-keyshortcuts="T G+F">
                Form
              </Tab>
            </TabList>
              <div className="app-main__scroll">
                <TabPanel value="scratchpad">
                  <ScratchpadView />
                </TabPanel>
                <TabPanel value="form">
                  <FormView />
                </TabPanel>
              </div>
            </Tabs>
          ) : (
            <div className="app-main__scroll">
              <BasicsEditor />
            </div>
          )}
        </main>
      </div>

      <ReturnFooter />

      {/* Mobile packet drawer. */}
      <Drawer
        open={packetDrawerOpen}
        onClose={() => setPacketDrawerOpen(false)}
        dismissable
        lightDismiss
        closeLabel="Close"
      >
        <DrawerTitle>Return packet</DrawerTitle>
        <DrawerBody>
          <ReturnPacket onNavigate={() => setPacketDrawerOpen(false)} />
        </DrawerBody>
      </Drawer>

      {/* Global overlays. */}
      <AddFormDialog />
      <CalculationTrace />
      <CoverageDrawer />
      <CommandPalette />
      <CompareScenariosDialog />
    </div>
  )
}
