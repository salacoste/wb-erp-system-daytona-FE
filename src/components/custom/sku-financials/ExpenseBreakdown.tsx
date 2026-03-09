'use client'

/**
 * Expense Breakdown Tooltip Component
 * Extracted from SkuFinancialsTable.tsx
 * Shows detailed operating expense breakdown per SKU
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SkuFinancialItem } from '@/types/sku-financials'
import { getTotalOperatingExpenses } from '@/types/sku-financials'
import { formatCurrency } from './sku-table-formatters'

interface ExpenseBreakdownProps {
  item: SkuFinancialItem
}

export function ExpenseBreakdown({ item }: ExpenseBreakdownProps) {
  const total = getTotalOperatingExpenses(item.costs)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted">{formatCurrency(total)}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-2">Операционные расходы</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Логистика:</span>
              <span>{formatCurrency(item.costs.logistics)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Хранение (Storage API):</span>
              <span>{formatCurrency(item.costs.storage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Штрафы:</span>
              <span>{formatCurrency(item.costs.penalties)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Платная приёмка:</span>
              <span>{formatCurrency(item.costs.paidAcceptance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Прочие удержания:</span>
              <span>{formatCurrency(item.costs.otherAdjustments)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between font-medium">
              <span>Итого:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
