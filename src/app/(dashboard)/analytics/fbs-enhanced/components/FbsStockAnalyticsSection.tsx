/**
 * FBS Stock Analytics Section — Section 2 of 5
 * Epic 129-FE Story 129.2: 5 KPI cards matching real backend contract per Request #202.
 *
 * Fields renamed: totalSkus→productCount, totalUnits→totalStock.
 * Dropped (no backend source): lowStockSkus, outOfStockSkus, avgDaysOfCover.
 * New fields: availableStock, reservedStock, inTransit.
 *
 * Pattern 1: independent null-state — renders empty state if stockAnalytics slice is null.
 */

'use client'

import { Package, Boxes, CheckCircle, Lock, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FbsStockAnalytics } from '@/types/fbs-enhanced'

interface FbsStockAnalyticsSectionProps {
  stockAnalytics: FbsStockAnalytics | null | undefined
}

interface KpiCardProps {
  title: string
  value: string
  icon: React.ReactNode
  /** Story 174.2 (C10): funnel semantic icon canon — muted fallback preserved. */
  iconClassName?: string
}

function KpiCard({ title, value, icon, iconClassName = 'text-muted-foreground' }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={iconClassName}>{icon}</span>
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

export function FbsStockAnalyticsSection({ stockAnalytics }: FbsStockAnalyticsSectionProps) {
  if (stockAnalytics == null) {
    return (
      <section aria-label="Аналитика остатков" data-testid="fbs-stock-analytics-section">
        <h2 className="text-lg font-semibold mb-3">Аналитика остатков</h2>
        <p className="text-sm text-muted-foreground">Нет данных по остаткам</p>
      </section>
    )
  }

  return (
    <section aria-label="Аналитика остатков" data-testid="fbs-stock-analytics-section">
      <h2 className="text-lg font-semibold mb-3">Аналитика остатков</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Story 174.2 (C10): neutral stock counts get categorical chart roles
            (funnel-route icon canon); available stock carries the positive valence. */}
        <KpiCard
          title="Товары (SKU)"
          value={formatCount(stockAnalytics.productCount)}
          icon={<Package className="h-4 w-4" />}
          iconClassName="text-chart-1"
        />
        <KpiCard
          title="Единиц на складе"
          value={formatCount(stockAnalytics.totalStock)}
          icon={<Boxes className="h-4 w-4" />}
          iconClassName="text-chart-2"
        />
        <KpiCard
          title="Доступно"
          value={formatCount(stockAnalytics.availableStock)}
          icon={<CheckCircle className="h-4 w-4" />}
          iconClassName="text-status-success"
        />
        <KpiCard
          title="Зарезервировано"
          value={formatCount(stockAnalytics.reservedStock)}
          icon={<Lock className="h-4 w-4" />}
          iconClassName="text-status-information"
        />
        <KpiCard
          title="В пути"
          value={formatCount(stockAnalytics.inTransit)}
          icon={<Truck className="h-4 w-4" />}
          iconClassName="text-chart-4"
        />
      </div>
    </section>
  )
}
