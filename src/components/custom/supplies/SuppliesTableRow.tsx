/**
 * SuppliesTableRow Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Individual table row for supplies list.
 */

'use client'

import { TableRow, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { SupplyStatusBadge } from './SupplyStatusBadge'
import type { SupplyListItem } from '@/types/supplies'

export interface SuppliesTableRowProps {
  supply: SupplyListItem
  onClick: (supply: SupplyListItem) => void
}

/** Format date for display */
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'dd.MM.yyyy HH:mm')
}

/** Truncate string with ellipsis */
function truncate(str: string | null, maxLength: number): string {
  if (!str) return '—'
  return str.length <= maxLength ? str : str.slice(0, maxLength) + '...'
}

export function SuppliesTableRow({ supply, onClick }: SuppliesTableRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(supply)
    }
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onClick(supply)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Поставка ${supply.wbSupplyId || supply.id}`}
    >
      <TableCell className="font-mono text-sm">{supply.wbSupplyId || '—'}</TableCell>

      <TableCell>
        {supply.name && supply.name.length > 40 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{truncate(supply.name, 40)}</span>
            </TooltipTrigger>
            <TooltipContent>{supply.name}</TooltipContent>
          </Tooltip>
        ) : (
          <span>{supply.name || '—'}</span>
        )}
      </TableCell>

      <TableCell>
        <SupplyStatusBadge status={supply.status} size="sm" />
      </TableCell>

      <TableCell className="text-right tabular-nums">{supply.ordersCount}</TableCell>

      <TableCell className="text-right tabular-nums">{formatCurrency(supply.totalValue)}</TableCell>

      <TableCell>{formatDateTime(supply.createdAt)}</TableCell>

      <TableCell>{formatDateTime(supply.closedAt)}</TableCell>
    </TableRow>
  )
}
