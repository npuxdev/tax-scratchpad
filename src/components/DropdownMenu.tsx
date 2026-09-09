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

/**
 * Product-specific Vlak extension: `side="top"` opens the menu upward.
 * Vlak's DropdownMenu only paints below the trigger. This is not an official
 * Vlak API or an upstream contribution — it applies a local class used by the
 * persistent return bar.
 */
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
