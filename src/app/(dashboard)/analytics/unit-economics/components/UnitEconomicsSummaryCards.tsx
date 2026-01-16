'use client'

import {
  DollarSign,
  Package,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UnitEconomicsSummary } from '@/types/unit-economics'
import { formatCurrency, formatPercentage } from '@/lib/unit-economics-utils'

/**
 * Unit Economics Summary Cards
 * Story 5.2: Unit Economics Page Structure
 * UX Specs by Sally (2025-12-09)
 *
 * Displays 6 key metrics in a responsive grid:
 * - Total Revenue
 * - Average COGS %
 * - Average WB Fees %
 * - Average Net Margin %
 * - Profitable SKUs
 * - Loss-making SKUs
 */

interface UnitEconomicsSummaryCardsProps {
  summary: UnitEconomicsSummary
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  label: string
  value: string
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtext,
  trend,
  trendValue,
}: MetricCardProps) {
  return (
    <Card className="min-h-[120px] hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', iconColor)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900 truncate">{value}</div>
            {subtext && (
              <div className="text-xs text-gray-400 mt-1">{subtext}</div>
            )}
            {trend && trendValue && (
              <div
                className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-gray-500'
                )}
              >
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trend === 'neutral' && '→'}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UnitEconomicsSummaryCards({ summary }: UnitEconomicsSummaryCardsProps) {
  const profitablePercent = summary.sku_count > 0
    ? ((summary.profitable_sku_count / summary.sku_count) * 100).toFixed(1)
    : '0'

  const lossPercent = summary.sku_count > 0
    ? ((summary.loss_making_sku_count / summary.sku_count) * 100).toFixed(1)
    : '0'

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

      {/* Total Revenue */}
      <MetricCard
        icon={DollarSign}
        iconColor="bg-red-500"
        label="Выручка"
        value={formatCurrency(summary.total_revenue)}
        subtext={`${summary.sku_count} SKU`}
      />

      {/* Average COGS % */}
      <MetricCard
        icon={Package}
        iconColor="bg-orange-500"
        label="COGS %"
        value={formatPercentage(summary.avg_cogs_pct)}
        trend={summary.avg_cogs_pct < 40 ? 'up' : summary.avg_cogs_pct > 50 ? 'down' : 'neutral'}
        trendValue={summary.avg_cogs_pct < 40 ? 'Хорошо' : summary.avg_cogs_pct > 50 ? 'Высоко' : 'Норма'}
      />

      {/* Average WB Fees % */}
      <MetricCard
        icon={Tag}
        iconColor="bg-purple-500"
        label="Комиссии WB %"
        value={formatPercentage(summary.avg_wb_fees_pct)}
        trend={summary.avg_wb_fees_pct < 40 ? 'up' : summary.avg_wb_fees_pct > 50 ? 'down' : 'neutral'}
        trendValue={summary.avg_wb_fees_pct < 40 ? 'Хорошо' : summary.avg_wb_fees_pct > 50 ? 'Высоко' : 'Норма'}
      />

      {/* Average Net Margin % */}
      <MetricCard
        icon={TrendingUp}
        iconColor="bg-green-500"
        label="Маржа %"
        value={formatPercentage(summary.avg_net_margin_pct)}
        trend={summary.avg_net_margin_pct >= 20 ? 'up' : summary.avg_net_margin_pct < 10 ? 'down' : 'neutral'}
        trendValue={summary.avg_net_margin_pct >= 20 ? 'Отлично' : summary.avg_net_margin_pct < 10 ? 'Низко' : 'Норма'}
      />

      {/* Profitable SKUs */}
      <MetricCard
        icon={CheckCircle}
        iconColor="bg-emerald-500"
        label="Прибыльные"
        value={`${summary.profitable_sku_count} SKU`}
        subtext={`(${profitablePercent}%)`}
      />

      {/* Loss-making SKUs */}
      <MetricCard
        icon={XCircle}
        iconColor="bg-red-500"
        label="Убыточные"
        value={`${summary.loss_making_sku_count} SKU`}
        subtext={`(${lossPercent}%)`}
      />
    </div>
  )
}
