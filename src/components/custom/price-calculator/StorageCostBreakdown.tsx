'use client'

/**
 * StorageCostBreakdown Component
 * Story 44.14-FE: Storage Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Collapsible breakdown showing storage cost calculation details
 */

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import type { StorageCostResult } from '@/lib/storage-cost-utils'

export interface StorageCostBreakdownProps {
  /** Storage calculation result */
  result: StorageCostResult
}

/**
 * Collapsible storage cost breakdown display
 * Shows calculation steps: base + additional liters + coefficient
 */
export function StorageCostBreakdown({ result }: StorageCostBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const additionalLiters = Math.max(0, result.volumeLiters - 1)
  const baseCost = result.tariff.basePerDayRub
  const additionalCost = additionalLiters * result.tariff.perLiterPerDayRub

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
        />
        Показать расчёт
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-2 text-sm border-l-2 border-muted pl-4">
        {/* Base rate */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовая ставка (1 л):</span>
          <span>{formatCurrency(baseCost)}/день</span>
        </div>

        {/* Additional liters */}
        {additionalLiters > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Доп. литры ({additionalLiters.toFixed(1)} л):
            </span>
            <span>{formatCurrency(additionalCost)}/день</span>
          </div>
        )}

        {/* Coefficient */}
        {result.tariff.coefficient !== 1.0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Коэффициент склада:</span>
            <span>×{result.tariff.coefficient.toFixed(2)}</span>
          </div>
        )}

        <Separator className="my-2" />

        {/* Daily total */}
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Итого/день:</span>
          <span>{formatCurrency(result.dailyCost)}</span>
        </div>

        {/* Period total */}
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">За {result.days} дней:</span>
          <span className="text-primary">{formatCurrency(result.totalCost)}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
