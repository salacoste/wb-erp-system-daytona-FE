/**
 * MetricCardEnhanced sub-components
 * Extracted from MetricCardEnhanced.tsx for file size compliance
 * Story 60.3-FE: Enhanced metric card
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { TrendIndicator } from './TrendIndicator'
import { ComparisonBadge } from './ComparisonBadge'
import type { ComparisonResult } from '@/lib/comparison-helpers'

export type MetricFormat = 'currency' | 'percentage' | 'number' | 'roas'

/** Check if user prefers reduced motion (safely handles SSR and test environments) */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function handleKeyDown(e: React.KeyboardEvent, onClick: () => void): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onClick()
  }
}

interface CardHeaderProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  tooltip?: string
}

export function MetricCardHeader({
  title,
  icon: Icon,
  tooltip,
}: CardHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" data-testid="metric-icon" />}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" data-testid="info-icon" />
          </TooltipTrigger>
          <TooltipContent size="md">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

interface ComparisonRowProps {
  comparison: ComparisonResult | null
  previousValue: number | null | undefined
  formatValue: (v: number) => string
  hasError: boolean
}

export function ComparisonRow({
  comparison,
  previousValue,
  formatValue,
  hasError,
}: ComparisonRowProps): React.ReactElement | null {
  if (hasError) return null

  if (comparison) {
    return (
      <div className="mt-1 flex items-center gap-1.5">
        <TrendIndicator direction={comparison.direction} size="sm" />
        <ComparisonBadge
          percentageChange={comparison.percentageChange}
          direction={comparison.direction}
          absoluteDifference={comparison.formattedDifference}
        />
        <span className="text-sm text-muted-foreground">(vs {formatValue(previousValue!)})</span>
      </div>
    )
  }

  if (previousValue === null || previousValue === undefined) {
    return (
      <div className="mt-1">
        <span className="text-sm text-muted-foreground">Нет данных за предыдущий период</span>
      </div>
    )
  }

  return null
}
