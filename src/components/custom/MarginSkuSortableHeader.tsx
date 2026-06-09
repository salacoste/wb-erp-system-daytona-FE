'use client'

/**
 * Sortable table header column with tooltip for MarginBySkuTable.
 * Extracted from MarginSkuTableHeader.tsx for 200-line compliance.
 */

import { TableHead } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { SortField, SortOrder } from './margin-sku-table-sorting'

// --- Sort Icon ---

function SortIcon({
  field,
  current,
  order,
}: {
  field: SortField
  current: SortField
  order: SortOrder
}) {
  if (current !== field) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
  return order === 'asc' ? (
    <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />
  )
}

// --- Sortable Column Header with Tooltip ---

interface SortableHeaderProps {
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  label: string
  tooltip?: string
  tooltipDetails?: string[]
  className?: string
}

/**
 * Reusable sortable column header with optional tooltip.
 * Wraps TableHead + sort button + SortIcon + tooltip.
 */
export function SortableHeader({
  field,
  sortField,
  sortOrder,
  onSort,
  label,
  tooltip,
  tooltipDetails,
  className,
}: SortableHeaderProps) {
  const SI = <SortIcon field={field} current={sortField} order={sortOrder} />

  if (!tooltip) {
    return (
      <TableHead className={className}>
        <button
          onClick={() => onSort(field)}
          className="ml-auto flex items-center font-medium hover:text-blue-600"
        >
          {label}
          {SI}
        </button>
      </TableHead>
    )
  }

  return (
    <TableHead className={className}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSort(field)}
              className="ml-auto flex items-center font-medium hover:text-blue-600"
            >
              {label}
              <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
              {SI}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">{tooltip}</p>
            {tooltipDetails?.map((detail, i) => (
              <p key={i} className="text-xs text-gray-400">
                {detail}
              </p>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableHead>
  )
}

// --- Exported for MarginSkuTableHeader ---

export { SortIcon }
