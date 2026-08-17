'use client'

/**
 * Alert summary KPI cards showing total alerts and breakdown by severity
 */

import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AlertSummary } from '@/types/alerts'
import { formatNumber } from '@/lib/utils'

interface AlertSummaryCardsProps {
  summary: AlertSummary | undefined
  isLoading: boolean
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number | undefined
  color: string
  iconClassName: string
}

function MetricCard({ icon, label, value, color, iconClassName }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${color} ${iconClassName}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value != null ? formatNumber(value) : '—'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function AlertSummaryCards({ summary, isLoading }: AlertSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  const bySeverity = summary?.bySeverity ?? {}

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        icon={<Bell className="h-5 w-5" />}
        label="Всего за 7 дней"
        value={summary?.totalAlerts}
        color="bg-primary"
        iconClassName="text-primary-foreground"
      />
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: severity counts default to 0 when absent */}
      <MetricCard
        icon={<AlertTriangle className="h-5 w-5" />}
        label="Критические"
        value={bySeverity.critical ?? 0}
        color="bg-status-error"
        iconClassName="text-status-error-foreground"
      />
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: severity counts default to 0 when absent */}
      <MetricCard
        icon={<AlertCircle className="h-5 w-5" />}
        label="Предупреждения"
        value={bySeverity.warning ?? 0}
        color="bg-status-warning"
        iconClassName="text-status-warning-foreground"
      />
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: severity counts default to 0 when absent */}
      <MetricCard
        icon={<Info className="h-5 w-5" />}
        label="Информационные"
        value={bySeverity.info ?? 0}
        color="bg-status-information"
        iconClassName="text-status-information-foreground"
      />
    </div>
  )
}
