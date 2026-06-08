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
  color: string
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
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
        icon={<TrendingUp className="h-5 w-5 text-white" />}
        label="Покрытие"
        value={data ? formatPercentage(data.coverage_percent) : '—'}
        color={
          data && data.coverage_percent >= 90
            ? 'bg-green-500'
            : data && data.coverage_percent >= 70
              ? 'bg-yellow-500'
              : 'bg-red-500'
        }
      />
      <MetricCard
        icon={<Calendar className="h-5 w-5 text-white" />}
        label="Всего дней"
        value={data ? formatNumber(data.total_days) : '—'}
        color="bg-blue-500"
      />
      <MetricCard
        icon={<CalendarCheck className="h-5 w-5 text-white" />}
        label="Данные есть"
        value={data ? formatNumber(data.existing_days) : '—'}
        color="bg-green-500"
      />
      <MetricCard
        icon={<CalendarX className="h-5 w-5 text-white" />}
        label="Пропущено"
        value={data ? formatNumber(data.missing_days) : '—'}
        color={data && data.missing_days > 0 ? 'bg-red-500' : 'bg-gray-400'}
      />
    </div>
  )
}
