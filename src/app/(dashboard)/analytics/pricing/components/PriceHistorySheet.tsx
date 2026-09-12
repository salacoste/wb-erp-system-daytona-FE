'use client'

/**
 * PriceHistorySheet — side panel with price/margin trend chart (Story 122.2-FE).
 * Opens when user clicks a row in PricingTable. Shows weekly price recommendation
 * history with dual Y-axis (RUB left, % right) using recharts LineChart.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { usePriceRecommendationHistory } from '@/hooks/usePriceRecommendations'
import type { PriceRecommendationHistoryPoint } from '@/types/price-recommendations'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface PriceHistorySheetProps {
  nmId: number | null
  vendorCode: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReturnFocus?: () => void
}

function formatWeek(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number | null; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'marginCurrent' || p.dataKey === 'marginRec'
            ? `${p.value != null ? formatPercentage(p.value) : '—'}`
            : `${p.value != null ? formatCurrency(p.value) : '—'}`}
        </p>
      ))}
    </div>
  )
}

export function PriceHistorySheet({
  nmId,
  vendorCode,
  open,
  onOpenChange,
  onReturnFocus,
}: PriceHistorySheetProps) {
  const { data, isLoading } = usePriceRecommendationHistory(nmId, 12)

  const chartData = (data ?? []).map((d: PriceRecommendationHistoryPoint) => ({
    week: formatWeek(d.weekStart),
    lastPrice: d.lastPrice,
    recommendedPrice: d.recommendedPrice,
    breakEvenPrice: d.breakEvenPrice,
    marginCurrent: d.marginAtCurrentPct,
    marginRec: d.marginAtRecPct,
    targetMarginPct: d.targetMarginPct,
  }))

  const targetMargin = data?.[0]?.targetMarginPct ?? 20

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[540px] sm:w-[640px] sm:max-w-[640px]"
        onCloseAutoFocus={event => {
          if (!onReturnFocus) return
          event.preventDefault()
          onReturnFocus()
        }}
      >
        <SheetHeader>
          <SheetTitle>
            История цен{vendorCode ? `: ${vendorCode}` : nmId ? `: ${nmId}` : ''}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[320px] w-full" />
            </div>
          )}

          {!isLoading && chartData.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              Нет исторических данных для этого товара
            </div>
          )}

          {!isLoading && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="rub" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="pct" orientation="right" unit="%" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="rub"
                  type="monotone"
                  dataKey="lastPrice"
                  stroke="var(--color-valence-neutral)"
                  strokeDasharray="5 5"
                  name="Текущая цена"
                  connectNulls={false}
                />
                <Line
                  yAxisId="rub"
                  type="monotone"
                  dataKey="recommendedPrice"
                  stroke="var(--color-chart-1)"
                  name="Рекомендация"
                  connectNulls={false}
                />
                <Line
                  yAxisId="rub"
                  type="monotone"
                  dataKey="breakEvenPrice"
                  stroke="var(--color-chart-8)"
                  name="Безубыточность"
                  connectNulls={false}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="marginCurrent"
                  stroke="var(--color-chart-7)"
                  strokeDasharray="5 5"
                  name="Маржа (текущ.)"
                  connectNulls={false}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="marginRec"
                  stroke="var(--color-valence-1)"
                  name="Маржа (рек.)"
                  connectNulls={false}
                />
                <ReferenceLine
                  yAxisId="pct"
                  y={targetMargin}
                  stroke="var(--color-chart-2)"
                  strokeDasharray="3 3"
                  label={{ value: `Целевая ${targetMargin}%`, fontSize: 11 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
