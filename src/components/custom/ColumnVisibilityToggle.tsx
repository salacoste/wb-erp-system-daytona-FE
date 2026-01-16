/**
 * Column Visibility Toggle Component
 * Story 6.3-FE: ROI & Profit Metrics Display
 *
 * Dropdown menu for toggling optional columns in analytics tables.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-react'
import {
  ColumnVisibility,
  OPTIONAL_COLUMNS,
} from '@/hooks/useColumnVisibility'

export interface ColumnVisibilityToggleProps {
  /** Current visibility state */
  visibility: ColumnVisibility
  /** Callback to toggle a column */
  onToggle: (column: keyof ColumnVisibility) => void
  /** Callback to reset to defaults */
  onReset?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Dropdown for toggling optional column visibility
 *
 * @example
 * <ColumnVisibilityToggle
 *   visibility={visibility}
 *   onToggle={toggleColumn}
 *   onReset={reset}
 * />
 */
export function ColumnVisibilityToggle({
  visibility,
  onToggle,
  onReset,
  className,
}: ColumnVisibilityToggleProps) {
  const visibleCount = Object.values(visibility).filter(Boolean).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings2 className="h-4 w-4 mr-2" />
          Колонки
          {visibleCount > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({visibleCount})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Дополнительные колонки</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONAL_COLUMNS.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={visibility[column.key]}
            onCheckedChange={() => onToggle(column.key)}
          >
            <div className="flex flex-col">
              <span>{column.label}</span>
              <span className="text-xs text-muted-foreground">
                {column.description}
              </span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        {onReset && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={onReset}
            >
              <span className="text-muted-foreground">Сбросить</span>
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
