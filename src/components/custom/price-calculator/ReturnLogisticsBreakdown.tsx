'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { ReturnLogisticsResult } from '@/lib/return-logistics-utils'

interface ReturnLogisticsBreakdownProps {
  result: ReturnLogisticsResult
}

/**
 * Return logistics breakdown collapsible display
 * Story 44.10-FE: Return Logistics Calculation
 */
export function ReturnLogisticsBreakdown({ result }: ReturnLogisticsBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        <span>Показать расчёт</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовая обратная логистика:</span>
          <span>{result.breakdown.baseReturnDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Buyback (выкуп):</span>
          <span>{result.breakdown.buybackDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Процент возврата:</span>
          <span>{result.breakdown.returnRateDisplay}</span>
        </div>
        <div className="border-t border-muted my-2" />
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Эффективная обратная:</span>
          <span className="text-primary">{result.breakdown.effectiveReturnDisplay}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
