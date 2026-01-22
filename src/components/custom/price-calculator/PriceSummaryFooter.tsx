'use client'

import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { Copy, CheckCircle2 } from 'lucide-react'
import { useState, useCallback } from 'react'

/** Copy feedback display duration in milliseconds */
const COPY_FEEDBACK_DURATION_MS = 2000

/**
 * Props for PriceSummaryFooter component
 */
export interface PriceSummaryFooterProps {
  /** Minimum price (floor) */
  minimumPrice: number
  /** Recommended price with margin + DRR */
  recommendedPrice: number
  /** Customer price after SPP discount */
  customerPrice?: number
  /** SPP percentage */
  sppPct?: number
}

/**
 * Price summary footer with copy buttons
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows a summary of all three price levels with copy-to-clipboard functionality:
 * - Minimum price (floor)
 * - Recommended price
 * - Customer price (if SPP > 0)
 *
 * @example
 * <PriceSummaryFooter
 *   minimumPrice={903.23}
 *   recommendedPrice={1217.39}
 *   customerPrice={1095.65}
 *   sppPct={10}
 * />
 */
export function PriceSummaryFooter({
  minimumPrice,
  recommendedPrice,
  customerPrice,
  sppPct,
}: PriceSummaryFooterProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = useCallback(async (value: number, field: string) => {
    const priceText = formatCurrency(value)
    try {
      await navigator.clipboard.writeText(priceText)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), COPY_FEEDBACK_DURATION_MS)
    } catch {
      console.error('Failed to copy price to clipboard')
    }
  }, [])

  // Fix: Use proper boolean check to prevent React rendering "0" as text
  const showCustomerPrice = Boolean(customerPrice && customerPrice > 0 && sppPct && sppPct > 0)

  return (
    <div
      className="border-t-2 border-double pt-4 space-y-2"
      data-testid="price-summary-footer"
    >
      {/* Minimum Price Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          МИНИМАЛЬНАЯ ЦЕНА (пол)
        </span>
        <div className="flex items-center gap-2">
          <span className="font-medium" data-testid="summary-minimum-price">
            {formatCurrency(minimumPrice)}
          </span>
          <CopyButton
            onClick={() => handleCopy(minimumPrice, 'minimum')}
            copied={copiedField === 'minimum'}
            label="Копировать минимальную цену"
          />
        </div>
      </div>

      {/* Recommended Price Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">РЕКОМЕНДУЕМАЯ ЦЕНА</span>
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-primary"
            data-testid="summary-recommended-price"
          >
            {formatCurrency(recommendedPrice)}
          </span>
          <CopyButton
            onClick={() => handleCopy(recommendedPrice, 'recommended')}
            copied={copiedField === 'recommended'}
            label="Копировать рекомендуемую цену"
          />
        </div>
      </div>

      {/* Customer Price Row (if SPP > 0) */}
      {showCustomerPrice && customerPrice && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            ЦЕНА ДЛЯ ПОКУПАТЕЛЯ (СПП {sppPct}%)
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium" data-testid="summary-customer-price">
              {formatCurrency(customerPrice)}
            </span>
            <CopyButton
              onClick={() => handleCopy(customerPrice, 'customer')}
              copied={copiedField === 'customer'}
              label="Копировать цену для покупателя"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Copy button sub-component
 */
interface CopyButtonProps {
  onClick: () => void
  copied: boolean
  label: string
}

function CopyButton({ onClick, copied, label }: CopyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-6 w-6 transition-all duration-200',
        copied && 'scale-110 text-green-600'
      )}
      onClick={onClick}
      aria-label={label}
    >
      {copied ? (
        <CheckCircle2
          className={cn(
            'h-3.5 w-3.5',
            'animate-in zoom-in-50 duration-200'
          )}
        />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
