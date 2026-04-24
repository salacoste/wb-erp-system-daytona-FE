/**
 * MonitorBuyoutGauge — Block 4: Semi-circular SVG buyout rate gauge
 * Epic 92-FE Story 92.5
 *
 * Threshold bands (doc-1 Block 4 spec):
 *   null  → gray  (#9CA3AF) — "Нет данных"
 *   >= 90 → green (#22C55E) — "Отличный"
 *   70-89 → amber (#F59E0B) — "Требует внимания"
 *   < 70  → red   (#EF4444) — "Низкий"
 *
 * NOTE: BuyoutRateCard.tsx uses a simpler 80% cutoff (green/red only).
 * This gauge uses the 3-band doc-1 spec because it has spatial real estate
 * for a middle band. The divergence is INTENTIONAL per spec.
 *
 * SVG arc geometry adapted from HealthScoreWidget.tsx:40-52,82-100.
 * Uses raw SVG (NOT recharts RadialBarChart) to avoid jsdom mock pain
 * encountered in Story 92.4.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getBuyoutColor } from './monitor-pipeline-utils'

interface MonitorBuyoutGaugeProps {
  buyoutRatePercent: number | null
}

// Arc geometry: 180-degree semi-circle — adapted from HealthScoreWidget.tsx:40-52
const RADIUS = 70
const STROKE_WIDTH = 12
const CX = 90
const CY = 85
const ARC_LENGTH = Math.PI * RADIUS // half-circumference ≈ 219.9

/** SVG path for a left-to-right semi-circle */
function arcPath(): string {
  const startX = CX - RADIUS
  const endX = CX + RADIUS
  return `M ${startX} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${CY}`
}

export function MonitorBuyoutGauge({ buyoutRatePercent: rate }: MonitorBuyoutGaugeProps) {
  const { hex, textClass, bandLabel } = getBuyoutColor(rate)

  // AC-9: clamp arc fill to [0, 100] for out-of-range inputs;
  // display the raw number + AlertTriangle anomaly indicator.
  const isOutOfRange = rate != null && (rate > 100 || rate < 0)
  const safeRate = rate == null ? 0 : Math.max(0, Math.min(100, rate))
  const fillLength = (safeRate / 100) * ARC_LENGTH

  // L-12 fix: replace duplicate-announcement aria-label with aria-labelledby + aria-valuetext.
  // Card title "Выкуп за 30 дней" (id="buyout-gauge-title") labels the meter;
  // aria-valuetext carries the numeric value for screen readers.
  const ariaValueText = rate == null ? 'нет данных' : `${rate}%`

  const path = arcPath()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle id="buyout-gauge-title" className="text-sm font-medium text-muted-foreground">
          Выкуп за 30 дней
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        <div
          role="meter"
          {...(rate != null ? { 'aria-valuenow': rate } : {})}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="buyout-gauge-title"
          aria-valuetext={ariaValueText}
          data-testid="monitor-buyout-gauge"
          className="relative"
        >
          <svg
            width={180}
            height={100}
            viewBox="0 0 180 100"
            aria-hidden="true"
            className="overflow-visible"
          >
            {/* Background track */}
            <path
              d={path}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
            {/* Filled arc — clamp prevents geometry overflow */}
            <path
              d={path}
              fill="none"
              stroke={hex}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${ARC_LENGTH}`}
              className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out"
            />
          </svg>

          {/* Center number */}
          <span
            className={cn(
              'absolute inset-0 flex items-end justify-center pb-1 text-4xl font-bold',
              textClass
            )}
            aria-hidden="true"
          >
            {rate == null ? '—' : `${rate}%`}
          </span>
        </div>

        {/* Band label */}
        <p className={cn('mt-2 text-center text-sm font-medium', textClass)}>{bandLabel}</p>

        {/* AC-9: out-of-range anomaly indicator */}
        {isOutOfRange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 cursor-help">
                <AlertTriangle className="h-3 w-3" />
                Аномальное значение
              </span>
            </TooltipTrigger>
            <TooltipContent size="sm">
              <p>Аномалия: значение вне диапазона 0-100%</p>
            </TooltipContent>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  )
}
