'use client'

/**
 * Visibility Tooltip Component
 * Extracted from SkuFinancialsTable.tsx
 * Shows commission and acquiring deductions that are already in net revenue
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye } from 'lucide-react'
import { formatCurrency } from './sku-table-formatters'

interface VisibilityTooltipProps {
  commission: number
  acquiring: number
}

export function VisibilityTooltip({ commission, acquiring }: VisibilityTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600">
            <Eye className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-2">Удержания WB (уже в выручке)</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Комиссия WB:</span>
              <span>{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Эквайринг:</span>
              <span>{formatCurrency(acquiring)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between font-medium">
              <span>Итого:</span>
              <span>{formatCurrency(commission + acquiring)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Эти суммы уже вычтены из gross для получения net выручки. НЕ добавляются в операционные
            расходы.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
