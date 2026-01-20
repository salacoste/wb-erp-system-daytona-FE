'use client'

import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getPriceGapColor, isTightMargin } from '@/lib/two-level-pricing'
import type { PriceGap } from '@/types/price-calculator'
import { AlertTriangle } from 'lucide-react'

/**
 * Props for TwoLevelPriceHeader component
 */
export interface TwoLevelPriceHeaderProps {
  /** Minimum price (floor) */
  minimumPrice: number
  /** Recommended price with margin + DRR */
  recommendedPrice: number
  /** Customer price after SPP discount */
  customerPrice?: number
  /** SPP percentage */
  sppPct?: number
  /** Price gap between recommended and minimum */
  priceGap: PriceGap
}

/**
 * Two-level price header display
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows:
 * - Minimum price (floor, covers fixed costs only)
 * - Recommended price (with margin and DRR)
 * - Customer price (after SPP discount, if applicable)
 * - Price gap indicator with color coding
 *
 * @example
 * <TwoLevelPriceHeader
 *   minimumPrice={903.23}
 *   recommendedPrice={1217.39}
 *   customerPrice={1095.65}
 *   sppPct={10}
 *   priceGap={{ rub: 314.16, pct: 34.78 }}
 * />
 */
export function TwoLevelPriceHeader({
  minimumPrice,
  recommendedPrice,
  customerPrice,
  sppPct,
  priceGap,
}: TwoLevelPriceHeaderProps) {
  const gapColor = getPriceGapColor(priceGap.pct)
  const showTightMarginWarning = isTightMargin(priceGap.pct)
  const showCustomerPrice = customerPrice && sppPct && sppPct > 0

  return (
    <div className="space-y-4" data-testid="two-level-price-header">
      {/* Minimum Price Card */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="text-sm text-muted-foreground uppercase tracking-wide">
          Минимальная цена
        </div>
        <div className="text-2xl font-bold" data-testid="minimum-price">
          {formatCurrency(minimumPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          покрывает фиксированные расходы (пол цены)
        </div>
      </div>

      {/* Recommended Price Card - Highlighted */}
      <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
        <div className="text-sm text-muted-foreground uppercase tracking-wide">
          Рекомендуемая цена
        </div>
        <div className="text-3xl font-bold text-primary" data-testid="recommended-price">
          {formatCurrency(recommendedPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          с учётом маржи и рекламы
        </div>
      </div>

      {/* Customer Price (if SPP > 0) */}
      {showCustomerPrice && (
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            Цена для покупателя
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold" data-testid="customer-price">
              {formatCurrency(customerPrice)}
            </span>
            <Badge variant="secondary" className="text-xs">
              СПП -{sppPct}%
            </Badge>
          </div>
        </div>
      )}

      {/* Price Gap Indicator */}
      <div
        className={cn('p-3 rounded-lg bg-muted/50 text-sm', gapColor)}
        data-testid="price-gap-indicator"
      >
        <div className="flex justify-between items-center">
          <span>Запас прибыльности:</span>
          <span className="font-medium">
            +{formatCurrency(priceGap.rub)} (+{priceGap.pct.toFixed(1)}%)
          </span>
        </div>
        {showTightMarginWarning && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Низкий запас прибыльности — есть риск убытков</span>
          </div>
        )}
      </div>
    </div>
  )
}
