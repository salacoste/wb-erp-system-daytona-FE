'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { TwoLevelPricingResult } from '@/types/price-calculator'

/**
 * High rate warning thresholds
 */
const HIGH_RATE_WARNING_THRESHOLD = 75
const HIGH_RATE_CRITICAL_THRESHOLD = 85

/**
 * Props for HighRateWarning component
 */
export interface HighRateWarningProps {
  /** Two-level pricing result with cost breakdowns */
  result: TwoLevelPricingResult
  /** DRR percentage (not included in percentageCosts.total) */
  drrPct: number
  /** Target margin percentage */
  marginPct: number
}

/**
 * Calculates total percentage rate from all sources
 * Formula: commission + acquiring + tax_income + vat + drr + margin
 */
function calculateTotalPctRate(
  result: TwoLevelPricingResult,
  drrPct: number,
  marginPct: number
): number {
  const { percentageCosts } = result

  const commissionPct = percentageCosts.commissionWb.pct
  const acquiringPct = percentageCosts.acquiring.pct
  const taxIncomePct = percentageCosts.taxIncome?.pct ?? 0
  const vatPct = percentageCosts.vat?.pct ?? 0

  return commissionPct + acquiringPct + taxIncomePct + vatPct + drrPct + marginPct
}

/**
 * Identifies top contributors to the high rate
 */
function getTopContributors(
  result: TwoLevelPricingResult,
  drrPct: number,
  marginPct: number
): Array<{ label: string; pct: number }> {
  const { percentageCosts } = result

  const contributors = [
    { label: 'Комиссия WB', pct: percentageCosts.commissionWb.pct },
    { label: 'Эквайринг', pct: percentageCosts.acquiring.pct },
    { label: 'Налог с выручки', pct: percentageCosts.taxIncome?.pct ?? 0 },
    { label: 'НДС', pct: percentageCosts.vat?.pct ?? 0 },
    { label: 'DRR (реклама)', pct: drrPct },
    { label: 'Маржа', pct: marginPct },
  ]

  // Sort by percentage descending and take top 3 non-zero
  return contributors
    .filter(c => c.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
}

/**
 * Warning component for high total percentage rate
 *
 * Shows warning when sum of percentage costs (commission, acquiring, tax, vat, drr, margin)
 * exceeds warning threshold (75%) or critical threshold (85%).
 *
 * High percentage rates mean only a small portion of price covers fixed costs,
 * leading to unrealistically high recommended prices.
 *
 * @example
 * <HighRateWarning result={twoLevelResult} drrPct={5} marginPct={20} />
 */
export function HighRateWarning({ result, drrPct, marginPct }: HighRateWarningProps) {
  const totalPctRate = calculateTotalPctRate(result, drrPct, marginPct)

  // No warning needed if under threshold
  if (totalPctRate < HIGH_RATE_WARNING_THRESHOLD) {
    return null
  }

  const isCritical = totalPctRate >= HIGH_RATE_CRITICAL_THRESHOLD
  const remainingPct = 100 - totalPctRate
  const topContributors = getTopContributors(result, drrPct, marginPct)

  // Format top contributors string for critical alert
  const contributorsText = topContributors
    .map(c => `${c.label} ${c.pct.toFixed(0)}%`)
    .join(', ')

  if (isCritical) {
    return (
      <Alert variant="destructive" data-testid="high-rate-warning-critical">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Критически высокая ставка: {totalPctRate.toFixed(1)}%</AlertTitle>
        <AlertDescription>
          <p>
            Рекомендованная цена может быть нереалистичной для рынка.
          </p>
          <p className="mt-1 text-xs">
            Основные статьи: {contributorsText}
          </p>
          <p className="mt-1 text-xs">
            Рекомендуем уменьшить маржу или проверить комиссию категории.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="warning" data-testid="high-rate-warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Высокая суммарная ставка: {totalPctRate.toFixed(1)}%</AlertTitle>
      <AlertDescription>
        <p>
          При такой ставке только {remainingPct.toFixed(1)}% от цены покрывает фиксированные затраты.
        </p>
        <p className="mt-1 text-xs">
          Рекомендуем проверить комиссию категории или уменьшить маржу/DRR.
        </p>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Export thresholds for testing
 */
export { HIGH_RATE_WARNING_THRESHOLD, HIGH_RATE_CRITICAL_THRESHOLD }
