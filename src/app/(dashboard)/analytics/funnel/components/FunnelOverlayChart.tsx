'use client'

/**
 * Funnel Overlay Chart — Story 73.8-FE
 * Recharts ComposedChart with dual Y-axes: funnel counts (left) + ad spend (right).
 */

import { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  OVERLAY_COLORS,
  formatOverlayDate,
  formatCompactRub,
  formatCompactCount,
  type OverlayMetricKey,
  type MergedChartDay,
} from './funnel-overlay-config'
import { OverlayTooltip, ChartLegend } from './FunnelOverlayTooltip'
import { FunnelChartAlert } from './FunnelOverlayAlerts'
import { OVERLAY_SERIES } from './funnel-overlay-config'

interface FunnelOverlayChartProps {
  data: MergedChartDay[]
  isLoading: boolean
  isError?: boolean
  showAdOverlay: boolean
  isAdLoading?: boolean
  dailyGranularityAvailable?: boolean
}

const BAR_CONFIG = { radius: [2, 2, 0, 0] as [number, number, number, number], maxBarSize: 24 }
const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 3, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 5, strokeWidth: 2 },
  animationDuration: 300,
}

export function FunnelOverlayChart({
  data,
  isLoading,
  isError,
  showAdOverlay,
  isAdLoading,
  dailyGranularityAvailable = true,
}: FunnelOverlayChartProps) {
  const funnelKeys: OverlayMetricKey[] = ['openCardCount', 'ordersCount', 'buyoutCount']
  const [visibleSeries, setVisibleSeries] = useState<string[]>([...funnelKeys])

  useEffect(() => {
    setVisibleSeries(prev => {
      const hasAd = prev.includes('adSpend')
      if (showAdOverlay && !hasAd) return [...prev, 'adSpend']
      if (!showAdOverlay && hasAd) return prev.filter(k => k !== 'adSpend')
      return prev
    })
  }, [showAdOverlay])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const activeSeries = OVERLAY_SERIES.filter(s => s.key !== 'adSpend' || showAdOverlay)

  // Alert/loading states (extracted for max-lines compliance)
  const alertContent = FunnelChartAlert({
    isLoading,
    isError,
    dailyGranularityAvailable,
    dataLength: data.length,
  })
  if (alertContent) return alertContent

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Динамика воронки по дням</CardTitle>
          {isAdLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <ChartLegend series={activeSeries} visible={visibleSeries} onToggle={toggleSeries} />
        <div
          role="img"
          aria-label="График воронки с наложением рекламных расходов"
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 24, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="date"
                tickFormatter={formatOverlayDate}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatCompactCount}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={50}
              />
              {showAdOverlay && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatCompactRub}
                  tick={{ fontSize: 12, fill: '#757575' }}
                  axisLine={{ stroke: '#EEEEEE' }}
                  tickLine={false}
                  width={60}
                />
              )}
              <Tooltip
                content={<OverlayTooltip visible={visibleSeries} showAdOverlay={showAdOverlay} />}
              />
              {funnelKeys
                .filter(k => visibleSeries.includes(k))
                .map(key => (
                  <Bar
                    key={key}
                    yAxisId="left"
                    dataKey={key}
                    fill={OVERLAY_COLORS[key]}
                    radius={BAR_CONFIG.radius}
                    maxBarSize={BAR_CONFIG.maxBarSize}
                    animationDuration={prefersReducedMotion ? 0 : 300}
                  />
                ))}
              {showAdOverlay && visibleSeries.includes('adSpend') && (
                <Line
                  yAxisId="right"
                  type={LINE_CONFIG.type}
                  dataKey="adSpend"
                  stroke={OVERLAY_COLORS.adSpend}
                  strokeWidth={LINE_CONFIG.strokeWidth}
                  strokeDasharray="6 3"
                  dot={LINE_CONFIG.dot}
                  activeDot={LINE_CONFIG.activeDot}
                  connectNulls={false}
                  animationDuration={prefersReducedMotion ? 0 : LINE_CONFIG.animationDuration}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
