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
 *
 * P2 /10-family (2026-09-02): success/warning moved from /10 tint to solid pair — light
 * 4.49/4.24 <4.5 AA fail; solid 5.13/4.81 light + 8.0/11.4 dark, both themes pass (173.12 canon);
 * borders stay tints (now /40 for success/warning, /60 for high; outside 1.4.3 scope).
 * Values: WCAG on the float blend of the 8-bit
 * token colors over the card surface — recompute, don't copy.
 * Destructive stays /10: measured 5.55:1 light (AA pass, both themes ≥5.55) — re-measure before touching.
 */
const COLOR_CLASSES: Record<string, string> = {
  destructive: 'bg-status-error/10 text-status-error border-status-error/30',
  success: 'bg-status-success text-status-success-foreground border-status-success/40',
  default: 'bg-muted text-foreground border-border',
  warning: 'bg-status-warning text-status-warning-foreground border-status-warning/40',
  // D-4 (2026-09-02): high moved from the /15 tint to a solid pair (173.12 canon) — WCAG 1.4.3
  // in both themes; border stays a tint (outside the 1.4.3 text-contrast scope).
  // P2 /10-family follow-up (2026-09-02): warning also moved to a solid pair — high re-differentiates
  // via border /60 (stronger emphasis; text contrast unaffected, borders outside 1.4.3 scope).
  high: 'bg-status-warning text-status-warning-foreground border-status-warning/60',
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
            {/* P2 /10-family (2026-09-02): text-status-warning on popover bg measured 4.81:1 light / 12.71:1 dark — AA pass, class unchanged. */}
            {info.percentageIncrease && info.percentageIncrease > 25 && (
              <p className="text-sm text-status-warning">
                Рекомендуем выбрать дату с меньшим коэффициентом
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
