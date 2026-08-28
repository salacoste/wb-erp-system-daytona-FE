/**
 * HealthScoreWidget — Semi-circular gauge showing system health 0-100
 * Epic 68-FE (Story 68.2)
 * Pattern: SVG arc with animated fill, accessible via aria-valuenow
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DashboardSystem } from '../types/monitoring'

interface HealthScoreWidgetProps {
  system: DashboardSystem | undefined
  isLoading: boolean
}

/**
 * Color thresholds for the gauge arc fill (monitor gauge canon, Story 172.12-FE):
 * positive >=80, warning 50-79, negative <50. Returns Tailwind stroke-* token classes —
 * the arc is a raw SVG <path>, where var() does not resolve in the stroke presentation
 * attribute, so the color is applied as a CSS class instead.
 */
function getScoreStrokeClass(score: number): string {
  if (score >= 80) return 'stroke-chart-positive'
  if (score >= 50) return 'stroke-status-warning'
  return 'stroke-chart-negative'
}

/** Russian status text by score band */
function getStatusText(score: number): string {
  if (score >= 80) return 'Все источники работают исправно'
  if (score >= 50) return 'Некоторые задержки'
  return 'Серьёзные проблемы'
}

/** Tailwind class for status text color */
function getStatusColorClass(score: number): string {
  if (score >= 80) return 'text-status-success'
  if (score >= 50) return 'text-status-warning'
  return 'text-status-error'
}

// Arc geometry: 180-degree semi-circle (top half)
const RADIUS = 70
const STROKE_WIDTH = 12
const CX = 90
const CY = 85
const ARC_LENGTH = Math.PI * RADIUS // half-circumference

/** Build SVG arc path for a semi-circle (left to right) */
function arcPath(): string {
  const startX = CX - RADIUS
  const endX = CX + RADIUS
  return `M ${startX} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${CY}`
}

export function HealthScoreWidget({ system, isLoading }: HealthScoreWidgetProps) {
  if (isLoading) return <HealthScoreWidgetSkeleton />

  const score = system?.healthScore ?? 0
  const alerts = system?.activeAlerts ?? 0
  const strokeClass = getScoreStrokeClass(score)
  const statusText = getStatusText(score)
  const statusClass = getStatusColorClass(score)
  // Clamp the arc fill to [0,100] for out-of-range inputs; display the raw score + an anomaly
  // indicator. Mirrors the AC-9 hardening in MonitorBuyoutGauge (this widget was its source but
  // never received the clamp — backend calculateHealthScore clamps the LOWER bound only).
  const isOutOfRange = score > 100 || score < 0
  const safeScore = Math.max(0, Math.min(100, score))
  const fillLength = (safeScore / 100) * ARC_LENGTH
  const path = arcPath()

  return (
    <Card>
      <CardContent className="flex flex-col items-center pb-4 pt-6">
        <div
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Индекс здоровья системы: ${score} из 100. ${statusText}`}
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
              className="stroke-chart-grid"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d={path}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${ARC_LENGTH}`}
              className={cn(
                strokeClass,
                'motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out'
              )}
            />
          </svg>

          {/* Score number centered inside arc */}
          <span
            className="absolute inset-0 flex items-end justify-center pb-1 text-4xl font-bold"
            aria-hidden="true"
          >
            {score}
          </span>
        </div>

        {/* Status text */}
        <p className={cn('mt-2 text-center text-sm font-medium', statusClass)}>{statusText}</p>

        {/* Out-of-range anomaly indicator (mirrors MonitorBuyoutGauge AC-9) */}
        {isOutOfRange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-status-warning cursor-help">
                <AlertTriangle className="h-3 w-3" />
                Аномальное значение
              </span>
            </TooltipTrigger>
            <TooltipContent size="sm">
              <p>Аномалия: индекс вне диапазона 0-100</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Alert count badge */}
        {alerts > 0 && (
          <span
            className="mt-2 inline-flex items-center rounded-full bg-status-error/10 px-2.5 py-0.5 text-xs font-semibold text-status-error"
            aria-label={`Активных оповещений: ${alerts}`}
          >
            {alerts} {alerts === 1 ? 'оповещение' : alerts < 5 ? 'оповещения' : 'оповещений'}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

function HealthScoreWidgetSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 pb-4 pt-6" aria-busy="true">
        <Skeleton className="h-[100px] w-[180px] rounded-t-full" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}
