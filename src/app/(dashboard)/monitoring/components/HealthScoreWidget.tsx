/**
 * HealthScoreWidget — Semi-circular gauge showing system health 0-100
 * Epic 68-FE (Story 68.2)
 * Pattern: SVG arc with animated fill, accessible via aria-valuenow
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardSystem } from '../types/monitoring'

interface HealthScoreWidgetProps {
  system: DashboardSystem | undefined
  isLoading: boolean
}

/** Color thresholds: green >=80, yellow 50-79, red <50 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

/** Russian status text by score band */
function getStatusText(score: number): string {
  if (score >= 80) return 'Все источники работают исправно'
  if (score >= 50) return 'Некоторые задержки'
  return 'Серьёзные проблемы'
}

/** Tailwind class for status text color */
function getStatusColorClass(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
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
  const color = getScoreColor(score)
  const statusText = getStatusText(score)
  const statusClass = getStatusColorClass(score)
  const fillLength = (score / 100) * ARC_LENGTH
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
              stroke="#E5E7EB"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${ARC_LENGTH}`}
              className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out"
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

        {/* Alert count badge */}
        {alerts > 0 && (
          <span
            className="mt-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700"
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
