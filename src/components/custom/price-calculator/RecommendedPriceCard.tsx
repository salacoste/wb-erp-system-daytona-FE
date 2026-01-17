'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import type { PriceCalculatorResponse } from '@/types/price-calculator'

/** Copy feedback display duration in milliseconds */
const COPY_FEEDBACK_DURATION_MS = 2000

/**
 * Props for RecommendedPriceCard component
 */
export interface RecommendedPriceCardProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse | null
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
}

/**
 * Large price display with copy button
 * Shows recommended selling price with margin indicator
 *
 * @example
 * <RecommendedPriceCard
 *   data={result}
 *   loading={false}
 * />
 */
export function RecommendedPriceCard({
  data,
  loading = false,
  error = null,
}: RecommendedPriceCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!data) return

    const priceText = formatCurrency(data.result.recommended_price)
    try {
      await navigator.clipboard.writeText(priceText)
      setCopied(true)
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS)
    } catch {
      console.error('Failed to copy price to clipboard')
    }
  }

  // Loading state
  if (loading) {
    return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse text-2xl text-muted-foreground">
            Calculating...
          </div>
        </div>
      </CardContent>
    </Card>
    )
  }

  // Error state
  if (error || !data || !data.result) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">
              {error?.message || 'Enter parameters and click Calculate'}
            </p>
          </div>
        </CardContent>
    </Card>
    )
  }

  const { recommended_price, actual_margin_pct } = data.result
  const isPositiveMargin = actual_margin_pct > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-lg font-medium">
          Recommended Selling Price
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="text-center">
          <div
            className={`text-4xl md:text-5xl font-bold ${
              isPositiveMargin ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(recommended_price)}
          </div>
        </div>

        {/* Copy Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Price
              </>
            )}
          </Button>
        </div>

        {/* Margin Info */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target Margin:</span>
            <span className="font-medium">{data.result.target_margin_pct}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Actual Margin:</span>
            <span
              className={`font-medium ${
                actual_margin_pct >= 20
                  ? 'text-green-600'
                  : actual_margin_pct >= 10
                    ? 'text-yellow-600'
                    : actual_margin_pct >= 5
                      ? 'text-orange-600'
                      : 'text-red-600'
              }`}
            >
              {actual_margin_pct.toFixed(2)}% ({formatCurrency(data.result.actual_margin_rub)})
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
