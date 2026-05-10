/**
 * FBS Order Stats Section — Section 1 of 5
 * Epic 96-FE Story 96.13: 5 KPI cards (total orders, delivered, returned, buyout rate, return rate).
 * M-1 fix: returnRate card added (was orphaned in types/normalizer but not rendered).
 * M-1 fix: averageOrderValue always rendered (null → '—' per Defensive Frontend Principle).
 *
 * Pattern 1: independent null-state — renders empty state if orderStats slice is null.
 * Null money/ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { ShoppingCart, CheckCircle, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPercentage, formatCurrency } from '@/lib/utils'
import type { FbsOrderStats } from '@/types/fbs-enhanced'

interface FbsOrderStatsSectionProps {
  orderStats: FbsOrderStats | null | undefined
}

interface KpiCardProps {
  title: string
  value: string
  icon: React.ReactNode
}

function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function FbsOrderStatsSection({ orderStats }: FbsOrderStatsSectionProps) {
  if (orderStats == null) {
    return (
      <section aria-label="Статистика заказов" data-testid="fbs-order-stats-section">
        <h2 className="text-lg font-semibold mb-3">Статистика заказов</h2>
        <p className="text-sm text-muted-foreground">Нет данных по заказам</p>
      </section>
    )
  }

  return (
    <section aria-label="Статистика заказов" data-testid="fbs-order-stats-section">
      <h2 className="text-lg font-semibold mb-3">Статистика заказов</h2>
      {/* L2-1 fix: xl:grid-cols-5 so 5th card wraps gracefully on common 1280px laptops */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          title="Всего заказов"
          value={String(orderStats.totalOrders)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KpiCard
          title="Доставлено"
          value={String(orderStats.deliveredOrders)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          title="Возвращено"
          value={String(orderStats.returnedOrders)}
          icon={<RotateCcw className="h-4 w-4" />}
        />
        <KpiCard
          title="Процент выкупа"
          value={orderStats.buyoutRate == null ? '—' : formatPercentage(orderStats.buyoutRate)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        {/* M-1 fix: returnRate was in types/normalizer but not rendered — orphan fixed */}
        <KpiCard
          title="Процент возвратов"
          value={orderStats.returnRate == null ? '—' : formatPercentage(orderStats.returnRate)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>
      {/* M-1 fix: always render averageOrderValue row (null → '—') per Defensive Frontend
          Principle — hidden row = silent transformation, not indication (CLAUDE.md) */}
      <p className="text-xs text-muted-foreground mt-2">
        Средний чек:{' '}
        <span>
          {orderStats.averageOrderValue == null
            ? '—'
            : formatCurrency(orderStats.averageOrderValue)}
        </span>
      </p>
    </section>
  )
}
