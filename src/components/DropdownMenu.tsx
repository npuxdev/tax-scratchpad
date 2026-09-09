import { forwardRef } from 'react'
import {
  DropdownMenu as VlakDropdownMenu,
  cx,
  type DropdownMenuProps as VlakDropdownMenuProps,
} from '@noorddev/vlak-react'

export type DropdownMenuSide = 'bottom' | 'top'

export interface DropdownMenuProps extends VlakDropdownMenuProps {
  /** Where the menu opens relative to the trigger. Vlak only ships below. */
  side?: DropdownMenuSide
}

/** Vlak DropdownMenu plus `side="top"` for chrome that sits on the bottom edge. */
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  function DropdownMenu({ side = 'bottom', className, ...props }, ref) {
    return (
      <VlakDropdownMenu
        ref={ref}
        className={cx(className, side === 'top' && 'rs-select--up')}
        {...props}
      />
    )
  },
)
