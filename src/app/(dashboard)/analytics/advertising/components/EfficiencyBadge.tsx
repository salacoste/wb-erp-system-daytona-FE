'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EfficiencyStatus } from '@/types/advertising-analytics'
import { getEfficiencyConfig } from '@/lib/efficiency-utils'

/**
 * Props for EfficiencyBadge component
 */
interface EfficiencyBadgeProps {
  /** Efficiency status from API */
  status: EfficiencyStatus
  /** Show recommendation tooltip */
  showRecommendation?: boolean
  /** Show icon in badge (AC1) */
  showIcon?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Efficiency Badge Component
 * Story 33.4-FE: Efficiency Status Indicators
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Color-coded badge by efficiency status (AC2)
 * - Icon appropriate to status (AC1)
 * - Tooltip with classification criteria (AC3)
 * - Optional recommendation text
 * - Accessible (aria-labels)
 */
export function EfficiencyBadge({
  status,
  showRecommendation = false,
  showIcon = true,
  className,
}: EfficiencyBadgeProps) {
  // F-47: guarded lookup — an out-of-union backend efficiency_status falls back to 'unknown'
  // instead of crashing on config.icon (the F-39 enum-crash class).
  const config = getEfficiencyConfig(status)
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'font-medium border-0 cursor-default inline-flex items-center gap-1',
              config.bgColor,
              config.textColor,
              className
            )}
            aria-label={`Статус эффективности: ${config.label}`}
          >
            {showIcon && <Icon className={cn('h-3 w-3', config.iconColor)} aria-hidden="true" />}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {showRecommendation && (
              <p className="text-xs text-blue-600 mt-1">💡 {config.recommendation}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// F-50: removed the duplicate getEfficiencyColor/getEfficiencyLabel that shadowed the
// canonical ones in @/lib/efficiency-utils (they were dead — no importer). Use the lib
// versions (both route through the guarded getEfficiencyConfig).
