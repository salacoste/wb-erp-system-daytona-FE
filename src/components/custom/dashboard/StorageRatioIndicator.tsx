/**
 * Storage Ratio Indicator Component
 * Story 63.5-FE: Storage Top Consumers Widget (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Displays storage-to-revenue ratio with color-coded severity indicators.
 * - >20%: Red (high risk) + warning icon
 * - 10-20%: Yellow (medium)
 * - <10%: Green (healthy)
 *
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type RatioSeverity = 'high' | 'medium' | 'low' | 'unknown'

export interface StorageRatioIndicatorProps {
  /** Storage-to-revenue ratio percentage (null if no revenue data) */
  ratio: number | null | undefined
  /** Show warning icon for high ratio (>20%) */
  showWarning?: boolean
}

/**
 * Determines severity level based on storage-to-revenue ratio
 * Per spec: >20% = high, 10-20% = medium, <10% = low
 */
export function getStorageRatioSeverity(ratio: number | null | undefined): RatioSeverity {
  if (ratio === null || ratio === undefined) return 'unknown'
  if (ratio > 20) return 'high'
  if (ratio > 10) return 'medium'
  return 'low'
}

const SEVERITY_COLORS: Record<RatioSeverity, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  unknown: 'bg-gray-300',
}

const SEVERITY_LABELS: Record<RatioSeverity, string> = {
  high: 'Высокие затраты на хранение (>20%)',
  medium: 'Умеренные затраты (10-20%)',
  low: 'Низкие затраты (<10%)',
  unknown: 'Нет данных о выручке',
}

export function StorageRatioIndicator({ ratio, showWarning = true }: StorageRatioIndicatorProps) {
  const severity = getStorageRatioSeverity(ratio)
  const hasData = ratio !== null && ratio !== undefined

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {hasData && (
              <span className={cn('text-sm', severity === 'high' && 'text-red-600 font-medium')}>
                {ratio.toFixed(1)}%
              </span>
            )}
            {showWarning && severity === 'high' && (
              <AlertTriangle className="h-3 w-3 text-red-500" aria-label="Требуется оптимизация" />
            )}
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', SEVERITY_COLORS[severity])}
              aria-label={SEVERITY_LABELS[severity]}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{SEVERITY_LABELS[severity]}</p>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            Отношение затрат на хранение к выручке.
            {severity === 'high' && ' Рекомендуется оптимизация запасов.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
