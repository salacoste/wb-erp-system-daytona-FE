'use client'

/**
 * Return Logistics Display Components
 * Extracted from ReturnLogisticsCalculator for max-lines compliance
 */

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatPercentage } from '@/lib/utils'
import { formatCurrencyFixed } from '@/lib/return-logistics-utils'

interface EffectiveReturnDisplayProps {
  effectiveReturn: number
  buybackPct: number
}

/** Shows the effective return logistics cost with buyback rate */
export function EffectiveReturnDisplay({
  effectiveReturn,
  buybackPct,
}: EffectiveReturnDisplayProps) {
  const isLow = effectiveReturn < 5
  return (
    <div className="flex justify-between items-center text-sm py-2 bg-muted/50 rounded px-3">
      <span className="text-muted-foreground">
        {`Эффективная обратная (с учётом buyback ${formatPercentage(buybackPct, 1)}):`}
      </span>
      <span className={isLow ? 'font-medium text-muted-foreground' : 'font-medium text-primary'}>
        {formatCurrencyFixed(effectiveReturn)}
      </span>
    </div>
  )
}

interface SignificantDifferenceWarningProps {
  calculatedBaseReturn: number
}

/** Warning shown when manual value differs significantly from calculated */
export function SignificantDifferenceWarning({
  calculatedBaseReturn,
}: SignificantDifferenceWarningProps) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        Значение значительно отличается от расчётного ({formatCurrencyFixed(calculatedBaseReturn)})
      </AlertDescription>
    </Alert>
  )
}
