/**
 * FBS Funnel Section — Section 5 of 5
 * Epic 96-FE Story 96.13: 4-stage conversion funnel (views → cart → orders → deliveries).
 *
 * Pattern 2: raw SVG chosen — funnel geometry is simple trapezoids; recharts has no
 * native funnel component; raw SVG is jsdom-testable without mocks, matching the
 * MonitorBuyoutGauge precedent (Story 92.5-FE).
 *
 * Pattern 1: independent null-state — renders empty state if funnelData slice is null.
 *
 * M-2 fix: funnel inversion detection — if any stage has more events than the previous
 * stage, an amber AlertTriangle is shown per CLAUDE.md Defensive Frontend Principle.
 * H2-2 fix: 5% relative tolerance + minimum-2-unit floor prevents false positives from
 * backend eventually-consistency (e.g., single late-arriving event).
 * FUTURE: if the funnel-inversion guard fires in production, file a backend ticket — funnel stages should
 * monotonically narrow (views ≥ cartAdds ≥ orders ≥ deliveries). Pure preventive guard; no current backend dep.
 *
 * L-1 fix: SVG has role="img" + <title> for accessibility (per MonitorBuyoutGauge precedent).
 * L-2-2 fix: AlertTriangle wrapper is keyboard-accessible (tabIndex=0, role=button, aria-label).
 * L-3 fix: 'В корзину' → 'Добавлено в корзину' (past-participle convention).
 * L-2 fix: inline colors replaced with CHART_COLORS tokens.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { FbsFunnelData } from '@/types/fbs-enhanced'

interface FbsFunnelSectionProps {
  funnelData: FbsFunnelData | null | undefined
}

interface FunnelStage {
  label: string
  subLabel: string
  value: number
  color: string
  anomalous: boolean
}

const STAGE_COLORS = [
  CHART_COLORS.primaryRed,
  CHART_COLORS.amber,
  CHART_COLORS.primaryBlue,
  CHART_COLORS.green,
]

const STAGE_LABELS: Array<{ label: string; subLabel: string }> = [
  { label: 'Просмотры товара', subLabel: 'product_views' },
  { label: 'Добавлено в корзину', subLabel: 'cart_adds' }, // L-3 fix: past-participle convention
  { label: 'Заказы', subLabel: 'orders' },
  { label: 'Доставлено', subLabel: 'deliveries' },
]

// SVG funnel geometry constants
const SVG_WIDTH = 400
const SVG_HEIGHT = 240
const STAGE_HEIGHT = SVG_HEIGHT / 4 // 60px per stage
const MAX_TOP_WIDTH = SVG_WIDTH * 0.9 // widest stage at 90% of SVG width
const MIN_BOTTOM_WIDTH = SVG_WIDTH * 0.2 // narrowest stage at 20%

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} тыс`
  return String(n)
}

/**
 * H2-2 fix: 5% relative tolerance + minimum-2-unit floor prevents false positives
 * from backend eventually-consistency (single late-arriving event).
 * Precedent: CLAUDE.md Defensive Frontend Principle price-inversion threshold
 * (`salePrice > price * 1.2` — 20% ratio); funnel uses tighter 5% since
 * funnel stages should strictly narrow.
 */
const ANOMALY_THRESHOLD_PCT = 0.05 // 5% relative overshoot to tolerate rounding noise
const ANOMALY_MIN_UNITS = 2 // absolute floor — single-unit ties are not anomalous

function isAnomalous(prevValue: number, currentValue: number): boolean {
  if (currentValue <= prevValue) return false
  const delta = currentValue - prevValue
  const relativeOver = prevValue > 0 ? delta / prevValue : Infinity
  return delta > ANOMALY_MIN_UNITS && relativeOver > ANOMALY_THRESHOLD_PCT
}

/** M-2 fix: detect funnel inversion (next stage > current stage) with H2-2 tolerance */
function buildStages(data: FbsFunnelData): FunnelStage[] {
  const values = [data.productViews, data.cartAdds, data.orders, data.deliveries]
  return STAGE_LABELS.map((meta, i) => ({
    label: meta.label,
    subLabel: meta.subLabel,
    value: values[i],
    color: STAGE_COLORS[i],
    // anomalous = this stage exceeds the preceding stage beyond tolerance threshold
    anomalous: i > 0 && isAnomalous(values[i - 1], values[i]),
  }))
}

export function FbsFunnelSection({ funnelData }: FbsFunnelSectionProps) {
  if (funnelData == null) {
    return (
      <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
        <h2 className="text-lg font-semibold mb-3">Воронка конверсии</h2>
        <p className="text-sm text-muted-foreground">Нет данных по воронке</p>
      </section>
    )
  }

  const stages = buildStages(funnelData)
  const maxValue = Math.max(...stages.map(s => s.value), 1) // guard against all-zero
  // M-2 fix: any stage inversion → show anomaly indicator near section header
  const hasInversion = stages.some(s => s.anomalous)

  return (
    <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Воронка конверсии</h2>
        {/* M-2 fix: inversion anomaly indicator per CLAUDE.md Defensive Frontend Principle */}
        {/* L2-2 fix: tabIndex=0 + role=button + aria-label makes tooltip keyboard-accessible */}
        {hasInversion && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                role="button"
                aria-label="Аномалия данных воронки"
                className="inline-flex items-center gap-1 text-amber-600 cursor-help"
                data-testid="fbs-funnel-inversion-warning"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Аномалия данных воронки: следующая стадия больше предыдущей. Возможна ошибка данных
                на стороне WB.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="rounded-md border bg-background p-4">
        <div className="flex flex-col items-center gap-0 lg:flex-row lg:items-start lg:gap-8">
          {/* SVG funnel — L-1 fix: role="img" + <title> for accessibility */}
          <svg
            role="img"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            data-testid="fbs-funnel-svg"
            className="shrink-0"
          >
            <title>Воронка конверсии — 4 стадии</title>
            {stages.map((stage, i) => {
              // Each stage width proportional to value / maxValue
              const ratio = maxValue > 0 ? stage.value / maxValue : 0
              const stageWidth = MIN_BOTTOM_WIDTH + ratio * (MAX_TOP_WIDTH - MIN_BOTTOM_WIDTH)
              // Trapezoid narrows slightly at bottom
              const nextRatio =
                i < stages.length - 1 ? stages[i + 1].value / maxValue : ratio * 0.85
              const nextWidth = MIN_BOTTOM_WIDTH + nextRatio * (MAX_TOP_WIDTH - MIN_BOTTOM_WIDTH)

              const topLeft = (SVG_WIDTH - stageWidth) / 2
              const topRight = topLeft + stageWidth
              const botLeft = (SVG_WIDTH - nextWidth) / 2
              const botRight = botLeft + nextWidth
              const y = i * STAGE_HEIGHT

              const points = [
                `${topLeft},${y}`,
                `${topRight},${y}`,
                `${botRight},${y + STAGE_HEIGHT - 2}`,
                `${botLeft},${y + STAGE_HEIGHT - 2}`,
              ].join(' ')

              return (
                <polygon
                  key={stage.subLabel}
                  points={points}
                  fill={stage.color}
                  opacity={0.85}
                  aria-label={`${stage.label}: ${formatCount(stage.value)}`}
                />
              )
            })}
          </svg>

          {/* Stage labels + values */}
          <div className="flex flex-col gap-3 mt-4 lg:mt-0">
            {stages.map((stage, i) => (
              <div key={stage.subLabel} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xl font-bold" style={{ color: stage.color }}>
                    {formatCount(stage.value)}
                  </p>
                  {i > 0 && stages[i - 1].value > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {((stage.value / stages[i - 1].value) * 100).toFixed(1)}% от предыдущего
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
