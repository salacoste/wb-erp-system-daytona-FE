'use client'

/**
 * FunnelTab — daily funnel visualization for Unified Product Analytics (Story 122.1-FE).
 *
 * Shows KPI summary cards (views → cart → orders → buyouts → cancels + conversion rates)
 * and a recharts ComposedChart with bars for counts + line for total conversion %.
 * Data comes from the unified-product response (FunnelDayItem[] + FunnelTotals).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatPercentage } from '@/lib/utils'
import type { FunnelDayItem, FunnelTotals } from '@/types/unified-product'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Colors from funnel-overlay-config.ts conventions
const COLORS = {
  views: '#60A5FA',
  cart: '#FBBF24',
  orders: '#FB923C',
  buyouts: '#4ADE80',
  conversion: '#7C3AED',
} as const

interface FunnelTabProps {
  dates: FunnelDayItem[]
  totals: FunnelTotals
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

function tooltipNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0
}

export function FunnelTab({ dates, totals }: FunnelTabProps) {
  const chartData = dates.map(d => ({
    date: formatDay(d.date),
    views: d.openCardCount,
    cart: d.addToCartCount,
    orders: d.ordersCount,
    buyouts: d.buyoutCount,
    conversion: d.totalConversion ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Просмотры" value={formatNumber(totals.openCardCount)} />
        <KpiCard title="Добавления в корзину" value={formatNumber(totals.addToCartCount)} />
        <KpiCard title="Заказы" value={formatNumber(totals.ordersCount)} />
        <KpiCard title="Выкупы" value={formatNumber(totals.buyoutCount)} />
        <KpiCard title="Отмены" value={formatNumber(totals.cancelCount)} />
        <KpiCard
          title="Конверсия в корзину"
          value={
            totals.avgCartConversion != null ? formatPercentage(totals.avgCartConversion) : '—'
          }
        />
        <KpiCard
          title="Конверсия в заказ"
          value={
            totals.avgOrderConversion != null ? formatPercentage(totals.avgOrderConversion) : '—'
          }
        />
        <KpiCard
          title="Сквозная конверсия"
          value={
            totals.avgBuyoutConversion != null ? formatPercentage(totals.avgBuyoutConversion) : '—'
          }
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Динамика воронки</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="counts" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  formatter={(value, name) => {
                    const label = String(name)
                    const numericValue = tooltipNumber(value)
                    if (label === 'Конверсия') return [formatPercentage(numericValue), label]
                    return [formatNumber(numericValue), label]
                  }}
                />
                <Legend />
                <Bar yAxisId="counts" dataKey="views" fill={COLORS.views} name="Просмотры" />
                <Bar yAxisId="counts" dataKey="cart" fill={COLORS.cart} name="В корзину" />
                <Bar yAxisId="counts" dataKey="orders" fill={COLORS.orders} name="Заказы" />
                <Bar yAxisId="counts" dataKey="buyouts" fill={COLORS.buyouts} name="Выкупы" />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="conversion"
                  stroke={COLORS.conversion}
                  strokeWidth={2}
                  dot={false}
                  name="Конверсия"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {chartData.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет данных за выбранный период
          </CardContent>
        </Card>
      )}
    </div>
  )
}
