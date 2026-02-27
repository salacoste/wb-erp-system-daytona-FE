/**
 * Net Profit Card — Story 66.6-FE: Net Profit After Tax Display
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Shows the best available net-profit metric with cascading fallback:
 *   net_profit_after_all_tax (VAT+income) -> net_profit_after_tax -> payout_total
 *
 * Green/Red accent based on sign. Displays after-tax margin and period comparison.
 *
 * @see docs/stories/epic-66/story-66.6-fe-net-profit-card.md
 */

'use client'

import { Banknote, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { getNetProfit, calculateAfterTaxMargin } from '@/lib/tax-display-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { HighlightedMetricSkeleton } from './MetricCardStates'
import type { TaxMetrics } from '@/types/finance-summary'

export interface NetProfitCardProps {
  taxMetrics: TaxMetrics | null
  payoutTotal: number | null
  saleGrossTotal: number | null
  previousTaxMetrics: TaxMetrics | null
  previousPayoutTotal: number | null
  isLoading: boolean
  className?: string
}

/** Margin color thresholds */
function marginColorClass(margin: number): string {
  if (margin > 10) return 'text-green-600'
  if (margin >= 0) return 'text-yellow-600'
  return 'text-red-600'
}

export function NetProfitCard({
  taxMetrics,
  payoutTotal,
  saleGrossTotal,
  previousTaxMetrics,
  previousPayoutTotal,
  isLoading,
  className,
}: NetProfitCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />

  // No data at all
  const hasData = payoutTotal != null || taxMetrics != null

  // Current period
  const result = hasData ? getNetProfit(taxMetrics, payoutTotal ?? 0) : null
  const margin =
    result != null ? calculateAfterTaxMargin(result.value, taxMetrics, saleGrossTotal) : null

  // Previous period comparison
  const prevHasData = previousPayoutTotal != null || previousTaxMetrics != null
  const prevResult = prevHasData ? getNetProfit(previousTaxMetrics, previousPayoutTotal ?? 0) : null
  const comparison =
    result && prevResult && prevResult.value !== 0
      ? calculateComparison(result.value, prevResult.value, false)
      : null

  // Style by sign
  const isPositive = result != null && result.value >= 0
  const borderColor = !result
    ? 'border-gray-300'
    : isPositive
      ? 'border-green-500'
      : 'border-red-500'
  const bgGradient = !result
    ? 'bg-gradient-to-br from-gray-50 to-white'
    : isPositive
      ? 'bg-gradient-to-br from-green-50 to-white'
      : 'bg-gradient-to-br from-red-50 to-white'
  const valueColor = isPositive ? 'text-green-600' : 'text-red-600'

  // Title with optional pre-tax suffix
  const title = result
    ? `${result.label}${result.isPreTax ? ' (до налога)' : ''}`
    : 'Чистая прибыль'

  const ariaLabel = result
    ? `${result.label}: ${formatCurrency(result.value)}`
    : 'Чистая прибыль: нет данных'

  return (
    <Card
      className={cn(
        'border-2 transition-shadow hover:shadow-md',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      aria-label={ariaLabel}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о чистой прибыли"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Чистая прибыль — итоговый финансовый результат после ВСЕХ вычетов.\nКаскадный расчёт (выбирается лучший доступный):\n1. Прибыль после УСН + НДС (если плательщик НДС)\n2. Прибыль после УСН (если настроена система)\n3. К перечислению (если налоги не настроены — показывается «до налога»)\nФормула: Операционная прибыль − Налог (УСН) − НДС к уплате.\n% под суммой — рентабельность после налогов = чистая прибыль / sale_gross × 100.\nОриентиры рентабельности: >10% — хорошо (зелёный), 0–10% — средне (жёлтый), <0% — убыток (красный).\nЕсли значение отрицательное — ваш бизнес убыточен за этот период.\nНастройка налогов: Настройки → Налоги.\nИсточник: расчёт из finance-summary + налоговые настройки.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {result ? (
            <span className={cn('text-xl font-bold', valueColor)}>
              {formatCurrency(result.value)}
            </span>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
        </div>
        {margin != null && (
          <div className="mt-1">
            <span className={cn('text-sm font-medium', marginColorClass(margin))}>
              {new Intl.NumberFormat('ru-RU', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(margin)}
              {' %'}
            </span>
          </div>
        )}
        {comparison && (
          <div className="mt-2 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
