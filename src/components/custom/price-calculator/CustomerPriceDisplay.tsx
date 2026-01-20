'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Store, User } from 'lucide-react'

/**
 * Props for CustomerPriceDisplay component
 */
export interface CustomerPriceDisplayProps {
  /** Recommended selling price from calculation */
  recommendedPrice: number
  /** SPP percentage (0-30) */
  sppPct: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Customer price display component
 * Story 44.19-FE: SPP Display (Customer Price)
 *
 * Shows price comparison when SPP > 0:
 * - Seller's price (what seller receives)
 * - Customer's price (what customer sees after WB discount)
 * - WB discount amount (provided at WB's expense)
 *
 * Formula: customer_price = recommended_price * (1 - spp_pct / 100)
 *
 * @example
 * <CustomerPriceDisplay
 *   recommendedPrice={4057.87}
 *   sppPct={10}
 * />
 * // Shows: Seller receives 4,057.87 ₽, Customer sees 3,652.08 ₽
 */
export function CustomerPriceDisplay({
  recommendedPrice,
  sppPct,
  className,
}: CustomerPriceDisplayProps) {
  // Only show if SPP > 0 and we have a valid price
  if (sppPct <= 0 || recommendedPrice <= 0) return null

  // Calculate customer price after SPP discount
  const customerPrice = recommendedPrice * (1 - sppPct / 100)
  const discountAmount = recommendedPrice - customerPrice

  return (
    <Card className={className} data-testid="customer-price-display">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Цена для покупателя (СПП)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller receives */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" aria-hidden="true" />
            <span>Ваша цена (получаете вы):</span>
          </div>
          <span className="font-medium" data-testid="seller-price">
            {formatCurrency(recommendedPrice)}
          </span>
        </div>

        {/* WB discount row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Скидка WB (-{sppPct}%):
          </span>
          <span
            className="text-green-600 font-medium"
            data-testid="wb-discount-amount"
          >
            -{formatCurrency(discountAmount)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Customer sees - highlighted */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-medium">Цена для покупателя:</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold text-primary"
              data-testid="customer-price"
            >
              {formatCurrency(customerPrice)}
            </span>
            <Badge variant="secondary" className="text-xs">
              -{sppPct}%
            </Badge>
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-muted-foreground pt-2">
          СПП — скидка WB за их счёт. Вы получаете полную сумму{' '}
          {formatCurrency(recommendedPrice)}
        </p>
      </CardContent>
    </Card>
  )
}
