/**
 * TurnoverCard -- Story 65.10: Inventory Turnover (days)
 *
 * Shows turnover days by sales or orders.
 * Formula: turnover = totalStock / (count / daysInPeriod)
 * Inverted comparison: lower days = good (green), higher = bad (red).
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 */

'use client'

import { TrendingDown, TrendingUp, Minus, RotateCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TurnoverTooltip } from './TurnoverTooltip'

export interface TurnoverCardProps {
  type: 'sales' | 'orders'
  totalStock: number | null
  count: number | null
  daysInPeriod: number
  previousTurnoverDays: number | null
  isLoading: boolean
}

const TITLES: Record<TurnoverCardProps['type'], string> = {
  sales: 'Оборот по продажам',
  orders: 'Оборот по заказам',
}

/** Calculate turnover in days; returns null when data is insufficient */
function calculateTurnover(
  totalStock: number | null,
  count: number | null,
  daysInPeriod: number
): number | null {
  if (totalStock === null || count === null || count === 0) return null
  const dailyAvg = count / daysInPeriod
  return Math.round(totalStock / dailyAvg)
}

/** Sentiment color based on turnover day thresholds */
function getValueColor(days: number): string {
  if (days < 30) return 'text-green-500'
  if (days <= 90) return 'text-yellow-500'
  return 'text-red-500'
}

/** Format turnover as "N дн." */
function formatDays(days: number): string {
  return `${days} дн.`
}

type TrendDirection = 'positive' | 'negative' | 'neutral'

function getTrendDirection(current: number, previous: number): TrendDirection {
  if (current < previous) return 'positive' // lower = faster = good
  if (current > previous) return 'negative' // higher = slower = bad
  return 'neutral'
}

const TREND_COLORS: Record<TrendDirection, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
}

const TREND_ICONS: Record<TrendDirection, typeof TrendingUp> = {
  positive: TrendingDown,
  negative: TrendingUp,
  neutral: Minus,
}

export function TurnoverCard({
  type,
  totalStock,
  count,
  daysInPeriod,
  previousTurnoverDays,
  isLoading,
}: TurnoverCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card aria-busy="true" aria-hidden="true">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="mt-1 h-7 w-24" />
          <Skeleton className="mt-1 h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  const turnoverDays = calculateTurnover(totalStock, count, daysInPeriod)
  const hasValue = turnoverDays !== null
  const displayValue = hasValue ? formatDays(turnoverDays) : '—'
  const direction =
    hasValue && previousTurnoverDays !== null
      ? getTrendDirection(turnoverDays, previousTurnoverDays)
      : null

  return (
    <Card className="transition-shadow hover:shadow-md" role="article">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{TITLES[type]}</span>
          </div>
          <TurnoverTooltip type={type} />
        </div>

        <div className="mt-1">
          <span
            className={cn('text-xl font-bold', hasValue ? getValueColor(turnoverDays) : '')}
            data-testid="metric-value"
          >
            {displayValue}
          </span>
        </div>

        {direction && <InlineTrend direction={direction} />}
      </CardContent>
    </Card>
  )
}

function InlineTrend({ direction }: { direction: TrendDirection }) {
  const Icon = TREND_ICONS[direction]
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <Icon
        data-testid="trend-indicator"
        className={cn('h-3 w-3', TREND_COLORS[direction])}
        aria-hidden="true"
      />
    </div>
  )
}
