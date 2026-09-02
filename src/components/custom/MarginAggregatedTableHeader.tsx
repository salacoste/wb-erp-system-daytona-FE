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
  // P2 boundary wave-2 (2026-09-03): sort-state accent = status-information, idle +
  // help icons = muted-foreground — same canon as SkuFinancialsTable/SkuTableHeaders.
  // status-information on card: 5.75 light / 8.53 dark (both AA).
  if (current !== field) return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
  return order === 'asc' ? (
    <ArrowUp className="ml-1 h-4 w-4 text-status-information" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4 text-status-information" />
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
  const ariaSort = (field: AggregatedSortField) =>
    sortField === field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined

  return (
    <TableHeader>
      <TableRow>
        <TableHead aria-sort={ariaSort('entity')}>
          <button
            onClick={() => onSort('entity')}
            className="flex items-center font-medium hover:text-status-information"
          >
            {entityLabel}
            {Icon('entity')}
          </button>
        </TableHead>
        <TableHead className="text-right" aria-sort={ariaSort('qty')}>
          <button
            onClick={() => onSort('qty')}
            className="ml-auto flex items-center font-medium hover:text-status-information"
          >
            Товаров (SKU){Icon('qty')}
          </button>
        </TableHead>
        <TableHead className="text-right" aria-sort={ariaSort('revenue_net')}>
          <button
            onClick={() => onSort('revenue_net')}
            className="ml-auto flex items-center font-medium hover:text-status-information"
          >
            Выручка{Icon('revenue_net')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <div className="flex items-center justify-end font-medium">Себестоимость</div>
        </TableHead>
        <TableHead className="text-right" aria-sort={ariaSort('profit')}>
          <button
            onClick={() => onSort('profit')}
            className="ml-auto flex items-center font-medium hover:text-status-information"
          >
            Прибыль{Icon('profit')}
          </button>
        </TableHead>
        <TableHead className="text-right" aria-sort={ariaSort('margin_pct')}>
          <button
            onClick={() => onSort('margin_pct')}
            className="ml-auto flex items-center font-medium hover:text-status-information"
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
        <TableHead className="text-right" title="Расходы на рекламу">
          <div className="ml-auto flex items-center font-medium">Реклама</div>
        </TableHead>
        <TableHead className="text-right" title="Доля рекламных расходов в выручке (ДРР)">
          <div className="ml-auto flex items-center font-medium">ДРР</div>
        </TableHead>
        <TableHead className="text-right" title="Чистая прибыль после налога">
          <div className="ml-auto flex items-center font-medium">Чист. прибыль</div>
        </TableHead>
        <TableHead className="text-right" title="Сумма продаж без скидок (СПП)">
          <div className="ml-auto flex items-center font-medium">СПП</div>
        </TableHead>
        <TableHead className="text-right" title="Количество отмен">
          <div className="ml-auto flex items-center font-medium">Отмены</div>
        </TableHead>
        <TableHead className="text-right" title="Стоимость остатков по закупочной цене">
          <div className="ml-auto flex items-center font-medium">Остаток ₽</div>
        </TableHead>
        <TableHead className="text-right" title="Доля стоимости остатков в оборотном капитале">
          <div className="ml-auto flex items-center font-medium">Доля остатка</div>
        </TableHead>
        {showProfitPerUnit && (
          <TableHead className="text-right" aria-sort={ariaSort('profit_per_unit')}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSort('profit_per_unit')}
                    className="ml-auto flex items-center font-medium hover:text-status-information"
                  >
                    Прибыль/ед.
                    <HelpCircle className="ml-1 h-3 w-3 text-muted-foreground" />
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
          <TableHead className="text-right" aria-sort={ariaSort('roi')}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSort('roi')}
                    className="ml-auto flex items-center font-medium hover:text-status-information"
                  >
                    ROI
                    <HelpCircle className="ml-1 h-3 w-3 text-muted-foreground" />
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
        <TableHead className="text-right" aria-sort={ariaSort('operating_profit')}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSort('operating_profit')}
                  className="ml-auto flex items-center font-medium hover:text-status-information"
                >
                  Опер. прибыль
                  <HelpCircle className="ml-1 h-3 w-3 text-muted-foreground" />
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
