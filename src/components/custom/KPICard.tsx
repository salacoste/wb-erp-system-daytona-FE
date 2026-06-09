/**
 * KPI Card Component
 * Story 6.4-FE: Cabinet Summary Dashboard
 *
 * Displays a single KPI metric with optional trend indicator.
 * Supports currency, percent, and number formats.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendDirection } from '@/types/analytics'
import { formatValue, getTrendIcon, getTrendColor } from './KPICard.helpers'

/**
 * Value format type for KPI display
 */
export type KPIFormat = 'currency' | 'percent' | 'number'

/**
 * Props for KPICard component
 */
export interface KPICardProps {
  /** Card title */
  title: string
  /** Value to display (undefined shows skeleton) */
  value: number | null | undefined
  /** Format type for value display */
  format?: KPIFormat
  /** Trend direction for indicator */
  trend?: TrendDirection
  /** Tooltip text for trend indicator */
  trendTooltip?: string
  /** Description tooltip explaining the metric (shows help icon) */
  description?: string
  /** Loading state */
  isLoading?: boolean
  /** Optional icon to display */
  icon?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * KPI Card component for displaying metrics with trends
 *
 * @example
 * <KPICard
 *   title="Выручка"
 *   value={1234567}
 *   format="currency"
 *   trend="up"
 *   trendTooltip="+15.2% vs прошлый период"
 * />
 */
export function KPICard({
  title,
  value,
  format = 'currency',
  trend,
  trendTooltip,
  description,
  isLoading = false,
  icon,
  className,
}: KPICardProps) {
  const trendIcon = getTrendIcon(trend)
  const trendColor = getTrendColor(trend)

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          {title}
          {description && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex">
                    <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatValue(value, format)}</span>
            {trendIcon && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn('inline-flex items-center transition-colors', trendColor)}
                      role="img"
                      aria-label={`Тренд: ${trend}`}
                    >
                      {trendIcon}
                    </span>
                  </TooltipTrigger>
                  {trendTooltip && (
                    <TooltipContent>
                      <p>{trendTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
