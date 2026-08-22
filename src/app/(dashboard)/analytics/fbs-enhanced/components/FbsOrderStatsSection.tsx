/**
 * FBS Order Stats Section — Section 1 of 5
 * Epic 129-FE Story 129.2: 7 KPI cards matching real backend contract per Request #202.
 *
 * Fields renamed: totalOrders→ordersCount, deliveredOrders→buyoutCount,
 * returnedOrders→cancelCount, returnRate→cancelRate, averageOrderValue→avgOrderValue.
 * New fields: ordersSumRub, addToCartPercent, ordersPercent.
 *
 * Pattern 1: independent null-state — renders empty state if orderStats slice is null.
 * Null money/ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { ShoppingCart, CheckCircle, XCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
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
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

/** Format count with Russian locale grouping. */
function formatCount(n: number): string {
  return n.toLocaleString('ru-RU')
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard
          title="Всего заказов"
          value={formatCount(orderStats.ordersCount)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KpiCard
          title="Сумма заказов"
          value={orderStats.ordersSumRub == null ? '—' : formatCurrency(orderStats.ordersSumRub)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          title="Доставлено"
          value={formatCount(orderStats.buyoutCount)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KpiCard
          title="Отменено"
          value={formatCount(orderStats.cancelCount)}
          icon={<XCircle className="h-4 w-4" />}
        />
        <KpiCard
          title="Процент выкупа"
          value={orderStats.buyoutRate == null ? '—' : formatPercentage(orderStats.buyoutRate)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          title="Процент отмен"
          value={orderStats.cancelRate == null ? '—' : formatPercentage(orderStats.cancelRate)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>
      {/* Average order value footer — null → '—' per Defensive Frontend Principle */}
      <p className="text-xs text-muted-foreground mt-2">
        Средний чек:{' '}
        <span className="tabular-nums">
          {orderStats.avgOrderValue == null ? '—' : formatCurrency(orderStats.avgOrderValue)}
        </span>
      </p>
    </section>
  )
}
