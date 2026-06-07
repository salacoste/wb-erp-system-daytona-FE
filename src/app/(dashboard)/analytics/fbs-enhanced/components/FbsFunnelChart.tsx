/**
 * FBS Funnel Chart helpers — extracted from FbsFunnelSection.tsx
 * Epic 96-FE Story 96.13: SVG funnel geometry, stage building, and formatting.
 *
 * Pattern 2: raw SVG — simple trapezoids; jsdom-testable without mocks.
 */

import { CHART_COLORS } from '@/lib/chart-colors'
import type { FbsFunnelData } from '@/types/fbs-enhanced'

export interface FunnelStage {
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
  { label: 'Добавлено в корзину', subLabel: 'cart_adds' },
  { label: 'Заказы', subLabel: 'orders' },
  { label: 'Доставлено', subLabel: 'deliveries' },
]

// SVG funnel geometry constants
export const SVG_WIDTH = 400
export const SVG_HEIGHT = 240
const STAGE_HEIGHT = SVG_HEIGHT / 4
const MAX_TOP_WIDTH = SVG_WIDTH * 0.9
const MIN_BOTTOM_WIDTH = SVG_WIDTH * 0.2

/** Russian-locale count formatting: "10,0 тыс" / "1,2 млн". */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} млн`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} тыс`
  return String(n)
}

// H2-2 fix: 5% relative tolerance + minimum-2-unit floor
const ANOMALY_THRESHOLD_PCT = 0.05
const ANOMALY_MIN_UNITS = 2

function isAnomalous(prevValue: number, currentValue: number): boolean {
  if (currentValue <= prevValue) return false
  const delta = currentValue - prevValue
  const relativeOver = prevValue > 0 ? delta / prevValue : Infinity
  return delta > ANOMALY_MIN_UNITS && relativeOver > ANOMALY_THRESHOLD_PCT
}

/** M-2 fix: detect funnel inversion with H2-2 tolerance */
export function buildStages(data: FbsFunnelData): FunnelStage[] {
  const values = [data.productViews, data.cartAdds, data.orders, data.deliveries]
  return STAGE_LABELS.map((meta, i) => ({
    label: meta.label,
    subLabel: meta.subLabel,
    value: values[i],
    color: STAGE_COLORS[i],
    anomalous: i > 0 && isAnomalous(values[i - 1], values[i]),
  }))
}

/** Compute polygon points for a single funnel stage. */
export function getStagePoints(
  stage: FunnelStage,
  index: number,
  stages: FunnelStage[],
  maxValue: number
): string {
  const ratio = maxValue > 0 ? stage.value / maxValue : 0
  const stageWidth = MIN_BOTTOM_WIDTH + ratio * (MAX_TOP_WIDTH - MIN_BOTTOM_WIDTH)
  const nextRatio = index < stages.length - 1 ? stages[index + 1].value / maxValue : ratio * 0.85
  const nextWidth = MIN_BOTTOM_WIDTH + nextRatio * (MAX_TOP_WIDTH - MIN_BOTTOM_WIDTH)

  const topLeft = (SVG_WIDTH - stageWidth) / 2
  const topRight = topLeft + stageWidth
  const botLeft = (SVG_WIDTH - nextWidth) / 2
  const botRight = botLeft + nextWidth
  const y = index * STAGE_HEIGHT

  return [
    `${topLeft},${y}`,
    `${topRight},${y}`,
    `${botRight},${y + STAGE_HEIGHT - 2}`,
    `${botLeft},${y + STAGE_HEIGHT - 2}`,
  ].join(' ')
}
