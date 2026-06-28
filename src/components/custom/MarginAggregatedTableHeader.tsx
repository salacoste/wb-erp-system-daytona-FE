'use client'

/**
 * Shared table header for MarginByBrandTable and MarginByCategoryTable
 * Extracted: Epic 74, Story 74.6
 */
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowUp, ArrowDown, ArrowUpDown, HelpCircle } from 'lucide-react'
import type { AggregatedSortField, SortOrder } from './margin-aggregated-table-sorting'

interface Props {
  entityLabel: string
  sortField: AggregatedSortField
  sortOrder: SortOrder
  onSort: (field: AggregatedSortField) => void
  showROI: boolean
  showProfitPerUnit: boolean
}

function SI({
  field,
  current,
  order,
}: {
  field: AggregatedSortField
  current: AggregatedSortField
  order: SortOrder
}) {
  if (current !== field) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
  return order === 'asc' ? (
    <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />
  )
}

export function MarginAggregatedTableHeader({
  entityLabel,
  sortField,
  sortOrder,
  onSort,
  showROI,
  showProfitPerUnit,
}: Props) {
  const Icon = (f: AggregatedSortField) => <SI field={f} current={sortField} order={sortOrder} />

  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <button
            onClick={() => onSort('entity')}
            className="flex items-center font-medium hover:text-blue-600"
          >
            {entityLabel}
            {Icon('entity')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('qty')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Товаров (SKU){Icon('qty')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('revenue_net')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Выручка{Icon('revenue_net')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <div className="flex items-center justify-end font-medium">Себестоимость</div>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('profit')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Прибыль{Icon('profit')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('margin_pct')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Маржа %{Icon('margin_pct')}
          </button>
        </TableHead>
        <TableHead className="text-right" title="Вклад в общую выручку">
          <div className="ml-auto flex items-center font-medium">Доля выручки</div>
        </TableHead>
        <TableHead className="text-right" title="Вклад в валовую прибыль">
          <div className="ml-auto flex items-center font-medium">Доля прибыли</div>
        </TableHead>
        {showProfitPerUnit && (
          <TableHead className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSort('profit_per_unit')}
                    className="ml-auto flex items-center font-medium hover:text-blue-600"
                  >
                    Прибыль/ед.
                    <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                    {Icon('profit_per_unit')}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Прибыль на единицу = Прибыль ÷ Количество</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableHead>
        )}
        {showROI && (
          <TableHead className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSort('roi')}
                    className="ml-auto flex items-center font-medium hover:text-blue-600"
                  >
                    ROI
                    <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                    {Icon('roi')}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Рентабельность инвестиций = (Прибыль ÷ COGS) × 100%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableHead>
        )}
        <TableHead className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSort('operating_profit')}
                  className="ml-auto flex items-center font-medium hover:text-blue-600"
                >
                  Опер. прибыль
                  <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                  {Icon('operating_profit')}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Валовая прибыль минус все расходы (логистика, хранение, комиссии)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableHead>
        <TableHead className="w-[100px] text-center">
          <div className="flex items-center justify-center font-medium">Без COGS</div>
        </TableHead>
        <TableHead className="w-[50px]" />
      </TableRow>
    </TableHeader>
  )
}
