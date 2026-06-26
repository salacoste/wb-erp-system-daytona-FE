/** Table header with sortable columns and tooltips — extracted for 200-line limit */

'use client'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SortField, SortOrder } from './performance-table.types'
import { SortableHeader } from './SortableHeader'

interface PerformanceTableHeaderProps {
  identifierLabel: string
  nameColumn: { key: string; label: string } | null
  sortBy: SortField
  sortOrder: SortOrder
  onSortChange: (field: SortField) => void
}

export function PerformanceTableHeader({
  identifierLabel,
  nameColumn,
  sortBy,
  sortOrder,
  onSortChange,
}: PerformanceTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead scope="col" className="min-w-[100px]">
          {identifierLabel}
        </TableHead>
        {nameColumn && (
          <TableHead scope="col" className="min-w-[200px]">
            {nameColumn.label}
          </TableHead>
        )}
        <TableHead scope="col" className="min-w-[100px] text-right">
          <SortableHeader
            label="Затраты"
            field="spend"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={onSortChange}
          />
        </TableHead>
        <HeaderTooltip
          minWidth="min-w-[120px]"
          label="Всего продаж"
          tooltip="Общая выручка товара (органика + реклама)"
        />
        <HeaderTooltip
          minWidth="min-w-[120px]"
          label="Из рекламы"
          tooltip="Выручка только из рекламных кампаний"
          hiddenOnNarrow
        />
        <HeaderTooltip
          minWidth="min-w-[100px]"
          label="Органика"
          tooltip="Продажи не связанные с рекламой (Всего - Реклама)"
          hiddenOnNarrow
        />
        <HeaderTooltip
          minWidth="min-w-[70px]"
          label="%"
          tooltip="Доля органики от общих продаж"
          hiddenOnNarrow
        />
        <TableHead scope="col" className="min-w-[100px] text-right">
          Прибыль
        </TableHead>
        <TableHead scope="col" className="min-w-[80px] text-right">
          <SortableHeader
            label="ROAS"
            field="roas"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={onSortChange}
          />
        </TableHead>
        <TableHead scope="col" className="min-w-[80px] hidden lg:table-cell text-right">
          <SortableHeader
            label="ROI"
            field="roi"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={onSortChange}
          />
        </TableHead>
        <TableHead scope="col" className="min-w-[70px] hidden lg:table-cell text-right">
          CTR
        </TableHead>
        <TableHead scope="col" className="min-w-[100px]">
          Статус
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

// Header tooltip helper (reduces repetition)
function HeaderTooltip({
  minWidth,
  label,
  tooltip,
  hiddenOnNarrow = false,
}: {
  minWidth: string
  label: string
  tooltip: string
  /** TZ-10: hide this secondary column below the lg breakpoint (primary cols stay visible). */
  hiddenOnNarrow?: boolean
}) {
  return (
    <TableHead
      scope="col"
      className={`${minWidth} text-right${hiddenOnNarrow ? ' hidden lg:table-cell' : ''}`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{label}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableHead>
  )
}
