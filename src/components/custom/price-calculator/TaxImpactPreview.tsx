'use client'

import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { TaxType } from '@/types/price-calculator'

export interface TaxImpactPreviewProps {
  taxType: TaxType
  calculatedTaxAmount?: number
  recommendedPrice?: number
}

/**
 * Tax impact preview showing calculated tax amount
 * Extracted from TaxConfigurationSection for file size compliance (Story 74.8)
 */
export function TaxImpactPreview({
  taxType,
  calculatedTaxAmount,
  recommendedPrice,
}: TaxImpactPreviewProps) {
  if (calculatedTaxAmount === undefined || calculatedTaxAmount <= 0) return null

  const taxPctOfPrice =
    recommendedPrice && recommendedPrice > 0 ? (calculatedTaxAmount / recommendedPrice) * 100 : 0

  return (
    <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="tax-impact-preview">
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {taxType === 'income' ? 'Налог с выручки:' : 'Налог с прибыли:'}
        </span>
        <span className="font-medium">
          {formatCurrency(calculatedTaxAmount)}
          {taxType === 'income' && taxPctOfPrice > 0 && (
            <span className="text-muted-foreground ml-1">
              ({formatPercentage(taxPctOfPrice, 1)})
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
