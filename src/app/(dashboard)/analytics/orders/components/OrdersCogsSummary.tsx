/**
 * COGS Summary Metrics for Orders Analytics
 *
 * Shows revenue, COGS, gross profit, and margin percentage
 * as summary cards below the main orders overview.
 *
 * Uses getOrdersWithCogs + transformToCogsMetrics directly
 * with from/to date range (bypasses week/month constraint
 * of useOrdersCogs hook).
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, TrendingUp, CircleDollarSign, Percent } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { getOrdersWithCogs, transformToCogsMetrics } from '@/hooks/orders-cogs-helpers'
import { ordersCogsQueryKeys } from '@/hooks/orders-cogs-types'

interface OrdersCogsSummaryProps {
  from: string
  to: string
}

/** Single metric card for COGS data */
function CogsMetricCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string
  value: string
  icon: React.ReactNode
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrdersCogsSummary({ from, to }: OrdersCogsSummaryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ordersCogsQueryKeys.byRangeWithOptions(from, to, 'total', true),
    queryFn: async () => {
      const response = await getOrdersWithCogs({
        from,
        to,
        include_cogs: true,
      })
      return transformToCogsMetrics(response)
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (!from || !to) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CogsMetricCard
        title="Выручка"
        value={data ? formatCurrency(data.totalAmount) : '—'}
        icon={<CircleDollarSign className="h-5 w-5 text-financial-positive" />}
        isLoading={isLoading}
      />
      <CogsMetricCard
        title="Себестоимость"
        value={data?.cogsTotal != null ? formatCurrency(data.cogsTotal) : '—'}
        icon={<Package className="h-5 w-5 text-status-information" />}
        isLoading={isLoading}
      />
      <CogsMetricCard
        title="Валовая прибыль"
        value={data?.grossProfit != null ? formatCurrency(data.grossProfit) : '—'}
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <CogsMetricCard
        title="Маржинальность"
        value={data?.marginPct != null ? formatPercentage(data.marginPct) : '—'}
        icon={<Percent className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
    </div>
  )
}
