'use client'

/**
 * Unit Economics Summary Cards
 * Story 5.2: Unit Economics Page Structure
 * UX Specs by Sally (2025-12-09)
 *
 * Displays 6 key metrics in a responsive grid:
 * - Total Revenue, Average COGS %, Average WB Fees %,
 * - Average Net Margin %, Profitable SKUs, Loss-making SKUs
 */

import { DollarSign, Package, Tag, Truck, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import type { UnitEconomicsSummary } from '@/types/unit-economics'
import { formatCurrency, formatPercentage } from '@/lib/unit-economics-utils'
import { MetricCard } from './UnitEconomicsMetricCard'

interface UnitEconomicsSummaryCardsProps {
  summary: UnitEconomicsSummary
  avgDeliveryCost?: number
  deliverySkuCount?: number
}

export function UnitEconomicsSummaryCards({
  summary,
  avgDeliveryCost,
  deliverySkuCount,
}: UnitEconomicsSummaryCardsProps) {
  // iter-62: render these sub-label shares in Russian locale via formatPercentage
  const profitablePercent =
    summary.sku_count > 0
      ? formatPercentage((summary.profitable_sku_count / summary.sku_count) * 100)
      : formatPercentage(0)

  const lossPercent =
    summary.sku_count > 0
      ? formatPercentage((summary.loss_making_sku_count / summary.sku_count) * 100)
      : formatPercentage(0)

  // Color the headline margin value by health (>=20 green, <10 red, else neutral).
  // null margin → neutral, never green/red (rule 2 / anti-pattern #8).
  const marginValueColor =
    summary.avg_net_margin_pct != null && summary.avg_net_margin_pct >= 20
      ? 'text-green-600'
      : summary.avg_net_margin_pct != null && summary.avg_net_margin_pct < 10
        ? 'text-red-600'
        : 'text-gray-900'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Request #58: YOUR Price Before Discounts - only show if available */}
      {summary.total_your_price !== undefined && summary.total_your_price > 0 && (
        <MetricCard
          icon={DollarSign}
          iconColor="bg-indigo-500"
          label="Ваша цена"
          value={formatCurrency(summary.total_your_price)}
          subtext="до скидок WB"
        />
      )}

      <MetricCard
        icon={DollarSign}
        iconColor="bg-red-500"
        label="Выручка"
        value={formatCurrency(summary.total_revenue)}
        subtext={`${summary.sku_count} SKU`}
      />

      <MetricCard
        icon={Package}
        iconColor="bg-orange-500"
        label="COGS %"
        value={formatPercentage(summary.avg_cogs_pct)}
        trend={
          summary.avg_cogs_pct != null && summary.avg_cogs_pct < 40
            ? 'up'
            : summary.avg_cogs_pct != null && summary.avg_cogs_pct > 50
              ? 'down'
              : 'neutral'
        }
        trendValue={
          summary.avg_cogs_pct != null && summary.avg_cogs_pct < 40
            ? 'Хорошо'
            : summary.avg_cogs_pct != null && summary.avg_cogs_pct > 50
              ? 'Высоко'
              : 'Норма'
        }
      />

      <MetricCard
        icon={Tag}
        iconColor="bg-purple-500"
        label="Комиссии WB %"
        value={formatPercentage(summary.avg_wb_fees_pct)}
        trend={
          summary.avg_wb_fees_pct < 40 ? 'up' : summary.avg_wb_fees_pct > 50 ? 'down' : 'neutral'
        }
        trendValue={
          summary.avg_wb_fees_pct < 40
            ? 'Хорошо'
            : summary.avg_wb_fees_pct > 50
              ? 'Высоко'
              : 'Норма'
        }
      />

      {/* Average delivery cost per unit — Story 77.5 */}
      <MetricCard
        icon={Truck}
        iconColor="bg-cyan-500"
        label="Ср. доставка"
        value={avgDeliveryCost != null ? formatCurrency(avgDeliveryCost) : '—'}
        subtext={
          deliverySkuCount != null ? `${deliverySkuCount} SKU с подтв. отправкой` : undefined
        }
      />

      <MetricCard
        icon={TrendingUp}
        iconColor="bg-green-500"
        label="Маржа %"
        value={formatPercentage(summary.avg_net_margin_pct)}
        valueClassName={marginValueColor}
        trend={
          summary.avg_net_margin_pct != null && summary.avg_net_margin_pct >= 20
            ? 'up'
            : summary.avg_net_margin_pct != null && summary.avg_net_margin_pct < 10
              ? 'down'
              : 'neutral'
        }
        trendValue={
          summary.avg_net_margin_pct != null && summary.avg_net_margin_pct >= 20
            ? 'Отлично'
            : summary.avg_net_margin_pct != null && summary.avg_net_margin_pct < 10
              ? 'Низко'
              : 'Норма'
        }
      />

      <MetricCard
        icon={CheckCircle}
        iconColor="bg-emerald-500"
        label="Прибыльные"
        value={`${summary.profitable_sku_count} SKU`}
        subtext={`(${profitablePercent})`}
      />

      <MetricCard
        icon={XCircle}
        iconColor="bg-red-500"
        label="Убыточные"
        value={`${summary.loss_making_sku_count} SKU`}
        subtext={`(${lossPercent})`}
      />
    </div>
  )
}
