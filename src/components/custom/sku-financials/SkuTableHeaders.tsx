'use client'

/**
 * SKU Financials Table Header Components
 * Extracted from SkuFinancialsTable.tsx — tooltip-rich column headers
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface SortableHeaderProps {
  onSort: () => void
  sortIcon: React.ReactNode
}

export function SalesQtyHeader({ onSort, sortIcon }: SortableHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-2">Продано шт.</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">Количество проданных единиц товара.</p>
              <p className="text-xs text-gray-400">Возвраты НЕ вычитаются из этого числа.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button onClick={onSort} className="flex items-center font-medium hover:text-blue-600">
        Продано
        {sortIcon}
      </button>
    </div>
  )
}

export function RevenueNetHeader({ onSort, sortIcon }: SortableHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-2">Выручка (net) — К перечислению</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                Сумма, которую WB перечисляет продавцу за реализованный товар.
              </p>
              <div className="bg-gray-800 rounded p-2 font-mono text-xs">
                <p className="text-green-400">Выручка (net) =</p>
                <p className="text-gray-400 pl-2">Продажи (net_for_pay)</p>
                <p className="text-red-400 pl-2">− Возвраты (net_for_pay)</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  • <strong>net_for_pay</strong> — «К перечислению за товар» из отчёта WB
                </p>
                <p>
                  • Комиссия WB и эквайринг <u>уже вычтены</u> из этой суммы
                </p>
                <p>• Это реальные деньги, которые поступят на счёт</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button onClick={onSort} className="flex items-center font-medium hover:text-blue-600">
        Выручка (net)
        {sortIcon}
      </button>
    </div>
  )
}

export function ExpensesHeader() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-end font-medium cursor-help">
            Расходы
            <HelpCircle className="ml-1 h-3 w-3 text-gray-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Логистика + Хранение + Штрафы + Приёмка + Прочие</p>
          <p className="text-xs text-gray-400">Комиссия и эквайринг уже вычтены из выручки</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function MarginHeader({ onSort, sortIcon }: SortableHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-2">Маржа % — Операционная маржинальность</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                Показывает, какой процент от выручки остаётся после вычета всех расходов.
              </p>
              <div className="bg-gray-800 rounded p-2 font-mono text-xs space-y-1">
                <p className="text-green-400">Маржа % = (Опер. прибыль / Выручка) x 100%</p>
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <p className="text-yellow-400">Опер. прибыль =</p>
                  <p className="text-gray-400 pl-2">Выручка (net)</p>
                  <p className="text-red-400 pl-2">- COGS (себестоимость)</p>
                  <p className="text-red-400 pl-2">- Логистика</p>
                  <p className="text-red-400 pl-2">- Хранение</p>
                  <p className="text-red-400 pl-2">- Штрафы</p>
                  <p className="text-red-400 pl-2">- Платная приёмка</p>
                  <p className="text-red-400 pl-2">- Прочие удержания</p>
                </div>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-green-400">• &gt;25% — Отлично</p>
                <p className="text-blue-400">• 15-25% — Хорошо</p>
                <p className="text-yellow-400">• 5-15% — Внимание</p>
                <p className="text-orange-400">• 0-5% — Критично</p>
                <p className="text-red-400">• &lt;0% — Убыток</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button onClick={onSort} className="flex items-center font-medium hover:text-blue-600">
        Маржа %{sortIcon}
      </button>
    </div>
  )
}
