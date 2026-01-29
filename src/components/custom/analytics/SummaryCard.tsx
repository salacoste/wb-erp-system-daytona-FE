/**
 * Summary Card Component
 * Story 51.5-FE: Trends Summary Cards
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Reusable metric card with icon, title, value, and optional delta indicator.
 * Supports loading state, color theming, and accessibility.
 */

'use client'

import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DeltaIndicator } from '@/components/custom/DeltaIndicator'
import { cn } from '@/lib/utils'

/**
 * Props for SummaryCard component
 */
export interface SummaryCardProps {
  /** Card title (Russian) */
  title: string
  /** Formatted value to display */
  value: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Icon component to display */
  icon: ReactNode
  /** Icon color theme */
  iconColor?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray'
  /** Optional delta percentage for comparison */
  delta?: number | null
  /** Invert delta colors (for metrics where negative is good) */
  deltaInverse?: boolean
  /** Tooltip text for delta */
  deltaTooltip?: string
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
  /** ARIA label for accessibility */
  'aria-label'?: string
}

/** Color configuration for icon theming */
const ICON_COLORS = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  purple: 'text-purple-600 bg-purple-100',
  red: 'text-red-600 bg-red-100',
  yellow: 'text-yellow-600 bg-yellow-100',
  gray: 'text-gray-600 bg-gray-100',
} as const

/**
 * Skeleton loader for SummaryCard
 */
function SummaryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4 bg-white', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Summary Card - displays a single metric with icon and optional delta
 *
 * @example
 * <SummaryCard
 *   title="Всего заказов"
 *   value="1 350"
 *   subtitle="за 30 дней"
 *   icon={<ShoppingCart />}
 *   iconColor="blue"
 *   delta={15.5}
 * />
 */
export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'blue',
  delta,
  deltaInverse = false,
  deltaTooltip,
  isLoading = false,
  className,
  'aria-label': ariaLabel,
}: SummaryCardProps) {
  if (isLoading) {
    return <SummaryCardSkeleton className={className} />
  }

  const iconColorClass = ICON_COLORS[iconColor]

  return (
    <Card
      className={cn('p-4 bg-white', className)}
      role="region"
      aria-label={ariaLabel || `${title}: ${value}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon container */}
        <div
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
            iconColorClass
          )}
          aria-hidden="true"
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-600 truncate">{title}</h3>

          {/* Value row with delta */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 truncate">{value}</span>
            {delta !== undefined && delta !== null && (
              <DeltaIndicator
                value={delta}
                type="percentage"
                inverse={deltaInverse}
                size="sm"
                showTooltip={!!deltaTooltip}
                tooltipText={deltaTooltip}
              />
            )}
          </div>

          {/* Subtitle */}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
    </Card>
  )
}
