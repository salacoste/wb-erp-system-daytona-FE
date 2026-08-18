'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'

/**
 * Defensive Frontend Principle indicator (Story 89.4-FE).
 * Shows a status-warning AlertTriangle + tooltip when VAT > fee anomaly detected.
 * Rule-of-two extraction: used in both AcquiringReportsTable (Story 90.2) and
 * AcquiringTransactionsTable (Story 90.3).
 *
 * Advisory: VAT > fee anomaly (Defensive Frontend Principle, Story 89.4-FE).
 * No backend ticket filed — pattern has not recurred at scale since deployment.
 * If frequency increases, create docs/request-backend/<NEXT_NUMBER>-vat-exceeds-fee.md.
 */
interface AnomalyVatIndicatorProps {
  fee: number | null
  vat: number | null
}

export function AnomalyVatIndicator({ fee, vat }: AnomalyVatIndicatorProps) {
  if (fee == null || vat == null || vat <= fee) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertTriangle
          className="h-4 w-4 text-status-warning inline-block ml-2"
          aria-label="Аномалия: НДС выше суммы комиссии"
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-xs">
          НДС ({formatCurrency(vat)}) выше суммы комиссии ({formatCurrency(fee)}) — возможная ошибка
          данных на стороне WB.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
