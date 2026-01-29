'use client'

/**
 * SeasonalInsightsCard Component
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Card displaying peak/low periods and seasonality index from seasonal analysis.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Calendar, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFbsSeasonal } from '@/hooks/useFbsAnalytics'
import { formatSeasonalIndex, getSeasonalityLevel } from '@/lib/fbs-analytics-utils'
import { translateMonth, translateDay, getSeasonalityColor } from '@/lib/seasonal-labels'
import type { SeasonalInsights } from '@/types/fbs-analytics'

// ============================================================================
// Constants
// ============================================================================

const CARD_TITLE = 'Ключевые инсайты'

// ============================================================================
// Component Props
// ============================================================================

interface SeasonalInsightsCardProps {
  /** Number of months to analyze (default: 12) */
  months?: number
  /** Additional class names */
  className?: string
}

// ============================================================================
// Insight Item Component
// ============================================================================

interface InsightItemProps {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}

function InsightItem({ icon, label, value, valueColor = 'text-gray-900' }: InsightItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn('text-sm font-medium truncate', valueColor)}>{value}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function SeasonalInsightsCard({ months = 12, className }: SeasonalInsightsCardProps) {
  const { data, isLoading, error } = useFbsSeasonal({ months, view: 'monthly' })

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-lg">{CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-lg">{CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>Не удалось загрузить инсайты сезонности.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const insights: SeasonalInsights | undefined = data?.insights

  if (!insights) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-lg">{CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Недостаточно данных для анализа сезонности.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const seasonalityValue = `${formatSeasonalIndex(insights.seasonalityIndex)} (${getSeasonalityLevel(insights.seasonalityIndex)})`

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{CARD_TITLE}</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Индекс сезонности показывает силу колебаний продаж. Высокий индекс означает
                значительные сезонные пики и спады.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InsightItem
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            label="Лучший месяц"
            value={translateMonth(insights.peakMonth)}
            valueColor="text-green-600"
          />
          <InsightItem
            icon={<TrendingDown className="h-5 w-5 text-red-600" />}
            label="Слабый месяц"
            value={translateMonth(insights.lowMonth)}
            valueColor="text-red-600"
          />
          <InsightItem
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            label="Лучший день"
            value={translateDay(insights.peakDayOfWeek)}
            valueColor="text-blue-600"
          />
          <InsightItem
            icon={
              <div
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold',
                  getSeasonalityColor(insights.seasonalityIndex)
                )}
              >
                S
              </div>
            }
            label="Индекс сезонности"
            value={seasonalityValue}
            valueColor={getSeasonalityColor(insights.seasonalityIndex)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
