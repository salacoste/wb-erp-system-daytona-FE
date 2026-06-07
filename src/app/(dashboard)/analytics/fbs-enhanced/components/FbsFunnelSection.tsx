/**
 * FBS Funnel Section — Section 5 of 5
 * Epic 129-FE Story 129.2: 2 conversion metrics from backend per Request #202.
 *
 * Replaced old 4-stage SVG funnel (views→cart→orders→deliveries) with
 * addToCartPercent and ordersPercent conversion rate display.
 *
 * Pattern 1: independent null-state — renders empty state if funnelData slice is null.
 * Null ratio fields render as '—' (CLAUDE.md anti-pattern #8).
 */

'use client'

import { ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPercentage } from '@/lib/utils'
import type { FbsFunnelData } from '@/types/fbs-enhanced'
import { buildMetrics } from './FbsFunnelChart'

interface FbsFunnelSectionProps {
  funnelData: FbsFunnelData | null | undefined
}

interface MetricRowProps {
  label: string
  value: string
  description: string
  icon: React.ReactNode
}

function MetricRow({ label, value, description, icon }: MetricRowProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

const METRIC_ICONS = [
  <ShoppingCart className="h-4 w-4" key="cart" />,
  <TrendingUp className="h-4 w-4" key="trend" />,
]

export function FbsFunnelSection({ funnelData }: FbsFunnelSectionProps) {
  if (funnelData == null) {
    return (
      <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
        <h2 className="text-lg font-semibold mb-3">Воронка конверсии</h2>
        <p className="text-sm text-muted-foreground">Нет данных по воронке</p>
      </section>
    )
  }

  const metrics = buildMetrics(funnelData)

  return (
    <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
      <h2 className="text-lg font-semibold mb-3">Воронка конверсии</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map((metric, i) => (
          <MetricRow
            key={metric.label}
            label={metric.label}
            value={metric.value == null ? '—' : formatPercentage(metric.value)}
            description={metric.description}
            icon={METRIC_ICONS[i]}
          />
        ))}
      </div>
    </section>
  )
}
