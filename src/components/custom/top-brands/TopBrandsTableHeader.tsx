/**
 * Top Brands Table Header
 * Story 6.4-FE / Story 74.6: Extracted from TopBrandsTable.tsx
 *
 * Table header row with tooltip-wrapped column labels.
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

/**
 * Reusable header cell with tooltip
 */
function HeaderWithTooltip({
  label,
  tooltip,
  align = 'left',
}: {
  label: string
  tooltip: string
  align?: 'left' | 'right'
}) {
  const justifyClass = align === 'right' ? 'justify-end' : ''
  return (
    <div className={`flex items-center gap-1 ${justifyClass}`}>
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex">
            <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

/**
 * Table header for TopBrandsTable
 */
export function TopBrandsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">#</TableHead>
        <TableHead>
          <HeaderWithTooltip
            label="Бренд"
            tooltip="Название бренда из карточки товара WB. Кликните для перехода к аналитике"
          />
        </TableHead>
        <TableHead className="text-right">
          <HeaderWithTooltip
            label="Выручка"
            tooltip="Сумма к перечислению (net_for_pay) по всем товарам бренда"
            align="right"
          />
        </TableHead>
        <TableHead className="text-right">
          <HeaderWithTooltip
            label="Прибыль"
            tooltip="Валовая прибыль: выручка минус себестоимость товаров бренда"
            align="right"
          />
        </TableHead>
        <TableHead className="text-right">
          <HeaderWithTooltip
            label="Маржа"
            tooltip="Маржинальность: доля прибыли в выручке бренда"
            align="right"
          />
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
