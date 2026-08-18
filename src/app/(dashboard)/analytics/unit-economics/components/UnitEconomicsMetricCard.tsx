/**
 * UnitEconomicsMetricCard — extracted from UnitEconomicsSummaryCards.tsx
 * Story 5.2: Unit Economics Page Structure
 */

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  /** Icon color on the chip — pass the paired *-foreground token for dark-safe contrast. */
  iconTextColor?: string
  label: string
  value: string
  subtext?: string
  /**
   * Direction semantics are metric-relative: for the margin card 'up' = high (good) margin;
   * for COST cards (COGS/fees) 'up' = low (good) cost. A future card passing both `trend` and
   * `valueClassName` must derive the value color with the metric's own threshold direction.
   */
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  /** Optional color for the headline value (default gray-900). Used to flag a loss-making margin. */
  valueClassName?: string
}

export function MetricCard({
  icon: Icon,
  iconColor,
  iconTextColor = 'text-white',
  label,
  value,
  subtext,
  trend,
  trendValue,
  valueClassName,
}: MetricCardProps) {
  return (
    <Card className="min-h-[120px] hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', iconColor)}>
            <Icon className={cn('h-5 w-5', iconTextColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-muted-foreground mb-1">{label}</div>
            <div className={cn('text-2xl font-bold truncate', valueClassName ?? 'text-foreground')}>
              {value}
            </div>
            {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
            {trend && trendValue && (
              <div
                className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  trend === 'up' && 'text-financial-positive',
                  trend === 'down' && 'text-financial-negative',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trend === 'neutral' && '→'}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
