'use client'

/**
 * MarginBySkuTable header component
 * Extracted from MarginBySkuTable.tsx (Epic 74, Story 74.6)
 */
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowUp, ArrowDown, ArrowUpDown, HelpCircle } from 'lucide-react'
import type { SortField, SortOrder } from './margin-sku-table-sorting'

interface Props {
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  showROI: boolean
  showProfitPerUnit: boolean
}

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

export function MarginSkuTableHeader({
  sortField,
  sortOrder,
  onSort,
  showROI,
  showProfitPerUnit,
}: Props) {
  const SI = (field: SortField) => <SortIcon field={field} current={sortField} order={sortOrder} />

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">
          <button
            onClick={() => onSort('sa_name')}
            className="flex items-center font-medium hover:text-blue-600"
          >
            Артикул МП{SI('sa_name')}
          </button>
        </TableHead>
        <TableHead>
          <button
            onClick={() => onSort('sa_name')}
            className="flex items-center font-medium hover:text-blue-600"
          >
            Артикул{SI('sa_name')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('qty')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Продано (шт){SI('qty')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <button
            onClick={() => onSort('revenue_net')}
            className="ml-auto flex items-center font-medium hover:text-blue-600"
          >
            Выручка{SI('revenue_net')}
          </button>
        </TableHead>
        <TableHead className="text-right">
          <div className="flex items-center justify-end font-medium">Себестоимость</div>
        </TableHead>
        <TableHead className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSort('profit')}
                  className="ml-auto flex items-center font-medium hover:text-blue-600"
                >
                  Прибыль
                  <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                  {SI('profit')}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Операционная прибыль = Выручка − COGS − Все расходы</p>
                <p className="text-xs text-gray-400">
                  (логистика, хранение, комиссия, эквайринг и др.)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableHead>
        <TableHead className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSort('margin_pct')}
                  className="ml-auto flex items-center font-medium hover:text-blue-600"
                >
                  Маржа %<HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
                  {SI('margin_pct')}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Операционная маржа =</p>
                <p>(Прибыль ÷ |Выручка|) × 100%</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Где Прибыль = Выручка − COGS − Все расходы:
                </p>
                <p className="text-xs text-gray-400">• Логистика (доставка + возврат)</p>
                <p className="text-xs text-gray-400">• Хранение</p>
                <p className="text-xs text-gray-400">• Комиссия WB, эквайринг, штрафы</p>
                <p className="text-xs text-gray-400 mt-2">
                  &gt;30% — отлично, 15-30% — хорошо, &lt;15% — низкая
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                    {SI('profit_per_unit')}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Прибыль на единицу = Операционная прибыль ÷ Количество</p>
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
                    {SI('roi')}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ROI = (Операционная прибыль ÷ COGS) × 100%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableHead>
        )}
        <TableHead className="w-[50px]" />
      </TableRow>
    </TableHeader>
  )
}
