/**
 * FBS Stock Analytics Section — Section 2 of 5
 * Epic 96-FE Story 96.13: 5 KPI cards (total SKUs, total units, low stock, out of stock, avg days of cover).
 *
 * Pattern 1: independent null-state — renders empty state if stockAnalytics slice is null.
 * Null ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { Package, Boxes, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FbsStockAnalytics } from '@/types/fbs-enhanced'
import { formatDecimal } from '@/lib/utils'

interface FbsStockAnalyticsSectionProps {
  stockAnalytics: FbsStockAnalytics | null | undefined
}

interface KpiCardProps {
  title: string
  value: string
  icon: React.ReactNode
  valueClassName?: string
}

function KpiCard({ title, value, icon, valueClassName }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={valueClassName ?? 'text-2xl font-bold'}>{value}</div>
      </CardContent>
    </Card>
  )
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
      {/* L2-1 fix: xl:grid-cols-5 so 5th card wraps gracefully on common 1280px laptops */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          title="Товары (SKU)"
          value={String(stockAnalytics.totalSkus)}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title="Единиц на складе"
          value={String(stockAnalytics.totalUnits)}
          icon={<Boxes className="h-4 w-4" />}
        />
        <KpiCard
          title="Мало остатков"
          value={String(stockAnalytics.lowStockSkus)}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          valueClassName={
            stockAnalytics.lowStockSkus > 0
              ? 'text-2xl font-bold text-amber-600'
              : 'text-2xl font-bold'
          }
        />
        <KpiCard
          title="Нет в наличии"
          value={String(stockAnalytics.outOfStockSkus)}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          valueClassName={
            stockAnalytics.outOfStockSkus > 0
              ? 'text-2xl font-bold text-red-600'
              : 'text-2xl font-bold'
          }
        />
        <KpiCard
          title="Дней покрытия (ср.)"
          value={
            stockAnalytics.avgDaysOfCover == null
              ? '—'
              : formatDecimal(stockAnalytics.avgDaysOfCover)
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
    </section>
  )
}
