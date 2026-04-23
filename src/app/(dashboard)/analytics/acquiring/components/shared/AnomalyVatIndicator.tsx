'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'

/**
 * Defensive Frontend Principle indicator (Story 89.4-FE).
 * Shows an amber AlertTriangle + tooltip when VAT > fee anomaly detected.
 * Rule-of-two extraction: used in both AcquiringReportsTable (Story 90.2) and
 * AcquiringTransactionsTable (Story 90.3).
 *
 * PENDING BACKEND: if VAT > fee pattern recurs at scale, file
 * docs/request-backend/NNN-*.md ticket.
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
          className="h-4 w-4 text-amber-500 inline-block ml-2"
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
