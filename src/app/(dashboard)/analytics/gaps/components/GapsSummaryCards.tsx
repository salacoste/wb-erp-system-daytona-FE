'use client'

/**
 * Summary cards showing coverage %, total/missing/existing days
 */

import { Calendar, CalendarCheck, CalendarX, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentage, formatNumber } from '@/lib/utils'
import type { FinancialGapsResponse } from '@/types/financial-gaps'

interface GapsSummaryCardsProps {
  data: FinancialGapsResponse | undefined
  isLoading: boolean
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  /** Full bg + text class pair for the icon chip; the icon inherits the chip text color. */
  color: string
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function GapsSummaryCards({ data, isLoading }: GapsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Покрытие"
        value={data ? formatPercentage(data.coverage_percent) : '—'}
        color={
          // BD-31: no data → neutral muted, not red (a red flash before data loads
          // reads as a critical-coverage alert that isn't real).
          !data
            ? 'bg-muted text-foreground'
            : data.coverage_percent >= 90
              ? 'bg-status-success text-status-success-foreground'
              : data.coverage_percent >= 70
                ? 'bg-status-warning text-status-warning-foreground'
                : 'bg-status-error text-status-error-foreground'
        }
      />
      <MetricCard
        icon={<Calendar className="h-5 w-5" />}
        label="Всего дней"
        value={data ? formatNumber(data.total_days) : '—'}
        color="bg-status-information text-status-information-foreground"
      />
      <MetricCard
        icon={<CalendarCheck className="h-5 w-5" />}
        label="Данные есть"
        value={data ? formatNumber(data.existing_days) : '—'}
        color="bg-status-success text-status-success-foreground"
      />
      <MetricCard
        icon={<CalendarX className="h-5 w-5" />}
        label="Пропущено"
        value={data ? formatNumber(data.missing_days) : '—'}
        color={
          data && data.missing_days > 0
            ? 'bg-status-error text-status-error-foreground'
            : 'bg-muted text-foreground'
        }
      />
    </div>
  )
}
