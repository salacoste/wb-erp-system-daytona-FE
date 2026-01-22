'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { LogisticsTariffResult } from '@/lib/logistics-tariff'

interface TariffBreakdownProps {
  result: LogisticsTariffResult
  warehouseName?: string
  isLoading?: boolean
}

/**
 * Tariff breakdown collapsible display component
 * Story 44.8-FE: Logistics Tariff Calculation
 */
export function TariffBreakdown({ result, warehouseName, isLoading }: TariffBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
          Показать расчёт
          {warehouseName && <span className="text-xs">({warehouseName})</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Объём:</span>
          <span>{result.breakdown.volumeDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовый тариф:</span>
          <span>{result.breakdown.baseRateDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Доп. литры:</span>
          <span>{result.breakdown.additionalDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Коэффициент:</span>
          <span>{result.breakdown.coefficientDisplay}</span>
        </div>
        <div className="border-t border-muted my-2" />
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Итого логистика:</span>
          <span className="text-primary">{result.breakdown.totalDisplay}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
