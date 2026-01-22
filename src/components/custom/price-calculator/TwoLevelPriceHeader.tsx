'use client'

import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { isTightMargin } from '@/lib/two-level-pricing'
import type { PriceGap } from '@/types/price-calculator'
import { AlertTriangle, TrendingUp } from 'lucide-react'

/**
 * Get price gap styles and icon based on percentage
 */
const getPriceGapStyles = (pct: number) => {
  if (pct > 20) {
    return {
      container: 'p-3 rounded-lg bg-green-50 text-green-700 border border-green-200',
      icon: TrendingUp,
    }
  }
  if (pct > 10) {
    return {
      container: 'p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200',
      icon: TrendingUp,
    }
  }
  return {
    container: 'p-3 rounded-lg bg-red-50 text-red-700 border border-red-200',
    icon: AlertTriangle,
  }
}

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

      {/* Recommended Price Card - Hero Highlighted */}
      <div
        className={cn(
          'p-6 rounded-xl',
          'bg-gradient-to-br from-primary/10 via-primary/5 to-background',
          'border-2 border-primary',
          'shadow-lg',
          'ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
            Рекомендуемая цена
          </span>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Целевая
          </Badge>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-4xl md:text-5xl font-bold text-primary drop-shadow-sm transition-all duration-300"
            data-testid="recommended-price"
          >
            {formatCurrency(recommendedPrice).replace(' ₽', '')}
          </span>
          <span className="text-2xl font-normal text-primary/70">₽</span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
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
      {(() => {
        const gapStyles = getPriceGapStyles(priceGap.pct)
        const GapIcon = gapStyles.icon
        return (
          <div className={gapStyles.container} data-testid="price-gap-indicator">
            <div className="flex items-center gap-2">
              <GapIcon className="h-4 w-4" aria-hidden="true" />
              <span>Запас прибыльности:</span>
              <span className="font-medium ml-auto">
                +{formatCurrency(priceGap.rub)} (+{priceGap.pct.toFixed(1)}%)
              </span>
            </div>
            {showTightMarginWarning && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>Низкий запас прибыльности — есть риск убытков</span>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
