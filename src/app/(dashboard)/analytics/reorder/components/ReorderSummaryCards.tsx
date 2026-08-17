/**
 * Reorder summary metric cards — pending, ordered, received counts + coverage %.
 */

'use client'

import { Clock, ShoppingCart, CheckCircle, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentageInt } from '@/lib/utils'
import type { ReorderFulfillmentMetrics } from '@/types/reorder-recommendations'

interface ReorderSummaryCardsProps {
  metrics: ReorderFulfillmentMetrics | undefined
  isLoading: boolean
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number | null
  sublabel?: string
}

function MetricCard({ icon, label, value, sublabel }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-muted p-2">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value ?? '—'}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function ReorderSummaryCards({ metrics, isLoading }: ReorderSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const avgOrderHours = metrics?.avgHoursToOrder
  const avgReceiveHours = metrics?.avgHoursToReceive

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: metric counts default to 0 when absent */}
      <MetricCard
        // 168.8: semantic status token (pending stage indicator)
        icon={<Clock className="h-5 w-5 text-status-warning" />}
        label="Ожидают"
        value={metrics?.totalPending ?? 0}
        sublabel={
          avgOrderHours != null ? `Ср. ${Math.round(avgOrderHours)} ч до заказа` : undefined
        }
      />
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: metric counts default to 0 when absent */}
      <MetricCard
        // 168.8: semantic status token (ordered stage indicator)
        icon={<ShoppingCart className="h-5 w-5 text-status-information" />}
        label="Заказано"
        value={metrics?.totalOrdered ?? 0}
        sublabel={
          avgReceiveHours != null ? `Ср. ${Math.round(avgReceiveHours)} ч до получения` : undefined
        }
      />
      {/* eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: metric counts default to 0 when absent */}
      <MetricCard
        // 168.8: semantic status token (process completeness, not financial)
        icon={<CheckCircle className="h-5 w-5 text-status-success" />}
        label="Получено"
        value={metrics?.totalReceived ?? 0}
      />
      <MetricCard
        // 168.8: semantic status token (risk metric, not financial loss)
        icon={<ShieldAlert className="h-5 w-5 text-status-error" />}
        label="Покрытие"
        value={
          metrics?.reorderCoveragePct != null
            ? formatPercentageInt(metrics.reorderCoveragePct)
            : '—'
        }
        sublabel="SKUs с рекомендацией"
      />
    </div>
  )
}
