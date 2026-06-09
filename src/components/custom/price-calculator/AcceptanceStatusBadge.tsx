'use client'

/**
 * Acceptance Status Badge Component
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Displays acceptance coefficient status with color-coded badge and tooltip.
 * Used next to delivery date picker and in coefficient calendar.
 *
 * @example
 * <AcceptanceStatusBadge coefficient={1.65} />
 * // Renders: [🔴 ×1,65] with orange background and tooltip
 */

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getAcceptanceStatusInfo, formatCoefficient } from '@/lib/acceptance-status-utils'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface AcceptanceStatusBadgeProps {
  /** Acceptance coefficient from SUPPLY API (-1 to any positive number) */
  coefficient: number
  /** Show tooltip with detailed information (default: true) */
  showTooltip?: boolean
  /** Badge size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Color Classes (Story AC1)
// ============================================================================

/**
 * Tailwind CSS color classes for each status variant
 * Based on Story 44.43-FE acceptance criteria
 */
const COLOR_CLASSES: Record<string, string> = {
  destructive: 'bg-red-100 text-red-700 border-red-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  default: 'bg-muted text-foreground border-border',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
} as const

/**
 * Size classes for badge variants
 * Default overrides the base text-xs from Badge component with text-sm
 * Small uses text-xs explicitly
 * Large uses text-base
 */
const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0',
  default: 'text-sm', // Override base text-xs
  lg: 'text-base px-3 py-1',
} as const

// ============================================================================
// Component
// ============================================================================

export function AcceptanceStatusBadge({
  coefficient,
  showTooltip = true,
  size = 'default',
  className,
}: AcceptanceStatusBadgeProps) {
  const info = getAcceptanceStatusInfo(coefficient)

  // Build aria-label for accessibility
  const ariaLabel = `Коэффициент приёмки: ${info.label}. ${info.description}`

  // Render badge content
  const badge = (
    <Badge
      variant="outline"
      className={cn(COLOR_CLASSES[info.color], SIZE_CLASSES[size], className)}
      aria-label={ariaLabel}
      data-testid="acceptance-status-badge"
    >
      {info.icon && <span className="mr-1">{info.icon}</span>}
      {info.label}
    </Badge>
  )

  // Return badge without tooltip if disabled
  if (!showTooltip) {
    return badge
  }

  // Return badge with tooltip (wrapped in TooltipProvider for self-containment)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs" size="md">
          <div className="space-y-1">
            <p className="font-medium">Коэффициент приёмки: {formatCoefficient(coefficient)}</p>
            <p className="text-sm text-muted-foreground">{info.description}</p>
            {info.percentageIncrease && info.percentageIncrease > 25 && (
              <p className="text-sm text-amber-600">
                Рекомендуем выбрать дату с меньшим коэффициентом
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
