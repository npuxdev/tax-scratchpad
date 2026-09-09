import { Button } from '@noorddev/vlak-react'
import { useAppStore } from '../state/AppStore'
import { useUiState } from '../app/UiState'
import { shortcutCaption } from '../app/hotkeys'
import { buildPacket, type PacketItem } from '../app/packet'

interface ReturnPacketProps {
  /** Called after a navigation choice — used to close the mobile drawer. */
  onNavigate?: () => void
}

export function ReturnPacket({ onNavigate }: ReturnPacketProps) {
  const { activeScenario, calculation, selectedFormId, setSelectedFormId, setMainView } =
    useAppStore()
  const { setAddFormOpen } = useUiState()

  if (!activeScenario) return null

  const packet = buildPacket(activeScenario, calculation)

  const select = (item: PacketItem) => {
    setSelectedFormId(item.id)
    if (item.kind === 'basics') {
      setMainView('scratchpad')
    } else if (item.kind === 'calculated' && !item.formInstanceId) {
      setMainView('form')
    }
    onNavigate?.()
  }

  const renderItem = (item: PacketItem) => (
    <li key={item.id}>
      <button
        type="button"
        className="packet__item"
        aria-current={selectedFormId === item.id}
        onClick={() => select(item)}
      >
        <span className="packet__item-label">{item.label}</span>
        {item.sublabel ? (
          <span className="packet__item-sub">{item.sublabel}</span>
        ) : null}
      </button>
    </li>
  )

  return (
    <nav className="packet" aria-label="Return packet">
      <section className="packet__section">
        <div className="packet__heading">
          <span>Inputs</span>
        </div>
        <ul className="packet__list">{packet.inputs.map(renderItem)}</ul>
        <div className="packet__add">
          <Button
            variant="ghost"
            size="sm"
            title={shortcutCaption('add-form')}
            aria-keyshortcuts="N"
            onClick={() => {
              setAddFormOpen(true)
              onNavigate?.()
            }}
          >
            + Add form
          </Button>
        </div>
      </section>

      <section className="packet__section">
        <div className="packet__heading">
          <span>Calculated</span>
        </div>
        <ul className="packet__list">{packet.calculated.map(renderItem)}</ul>
      </section>
    </nav>
  )
}
