/**
 * Profitability Badge Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Color-coded badge displaying profitability status with icon and tooltip.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { type ExtendedProfitabilityStatus, EXTENDED_STATUS_CONFIG } from '@/lib/profitability-utils'

/**
 * Icon mapping for each profitability status
 */
const STATUS_ICONS: Record<ExtendedProfitabilityStatus, React.ElementType> = {
  excellent: TrendingUp,
  good: CheckCircle,
  warning: AlertTriangle,
  critical: TrendingDown,
  loss: XCircle,
  unknown: HelpCircle,
}

export interface ProfitabilityBadgeProps {
  /** Profitability status */
  status: ExtendedProfitabilityStatus
  /** Show tooltip with threshold info (default: true) */
  showTooltip?: boolean
  /** Badge size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

/**
 * Profitability Badge
 *
 * Displays profitability status with:
 * - Color-coded background matching status severity
 * - Icon indicating trend direction
 * - Optional tooltip with threshold and recommendation
 */
export function ProfitabilityBadge({
  status,
  showTooltip = true,
  size = 'sm',
  className,
}: ProfitabilityBadgeProps) {
  const config = EXTENDED_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1',
        config.bgClass,
        config.textClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
      {config.label}
    </Badge>
  )

  if (!showTooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.threshold}</p>
          <p className="text-sm">{config.recommendation}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// Re-export for convenience
export { getProfitabilityStatus } from '@/lib/profitability-utils'
export type { ExtendedProfitabilityStatus } from '@/lib/profitability-utils'
