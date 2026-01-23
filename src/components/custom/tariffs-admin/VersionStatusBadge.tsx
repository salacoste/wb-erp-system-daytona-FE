// ============================================================================
// Version Status Badge Component
// Epic 52-FE: Story 52-FE.1 - Version History Table
// Displays tariff version status with color-coded badges
// ============================================================================

import { cn } from '@/lib/utils'
import type { TariffVersionStatus } from '@/types/tariffs-admin'

/**
 * Status configuration with Russian labels and Tailwind classes
 * - scheduled: Blue - future version pending activation
 * - active: Green - currently effective version
 * - expired: Gray - past version no longer active
 */
const STATUS_CONFIG: Record<
  TariffVersionStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  scheduled: {
    label: 'Запланировано',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  active: {
    label: 'Активно',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  expired: {
    label: 'Истекло',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
}

interface VersionStatusBadgeProps {
  /** Version status from API */
  status: TariffVersionStatus
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays version status with appropriate color styling
 *
 * @example
 * ```tsx
 * <VersionStatusBadge status="active" />
 * // Renders: Green badge with "Активно"
 *
 * <VersionStatusBadge status="scheduled" />
 * // Renders: Blue badge with "Запланировано"
 * ```
 */
export function VersionStatusBadge({
  status,
  className,
}: VersionStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  )
}

/**
 * Get status configuration for external use
 * Useful for legends, filters, or other UI elements
 */
export function getStatusConfig(status: TariffVersionStatus) {
  return STATUS_CONFIG[status]
}

/**
 * Get all available statuses for filters
 */
export function getAllStatuses(): TariffVersionStatus[] {
  return ['scheduled', 'active', 'expired']
}
