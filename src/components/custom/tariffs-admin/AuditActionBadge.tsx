// ============================================================================
// Audit Action Badge Component
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Displays audit action type with color-coded badges
// ============================================================================

import { cn } from '@/lib/utils'
import type { TariffAuditEntry } from '@/types/tariffs-admin'

type AuditAction = TariffAuditEntry['action']

/**
 * Action configuration with Russian labels and Tailwind classes
 * - UPDATE: Blue - field value modification
 * - CREATE: Green - new value or version created
 * - DELETE: Red - value or version removed
 */
const ACTION_CONFIG: Record<
  AuditAction,
  { label: string; bgColor: string; textColor: string }
> = {
  UPDATE: {
    label: 'Изменение',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  CREATE: {
    label: 'Создание',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  DELETE: {
    label: 'Удаление',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
}

interface AuditActionBadgeProps {
  /** Audit action type from API */
  action: AuditAction
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays audit action type with appropriate color styling
 *
 * @example
 * ```tsx
 * <AuditActionBadge action="UPDATE" />
 * // Renders: Blue badge with "Изменение"
 *
 * <AuditActionBadge action="CREATE" />
 * // Renders: Green badge with "Создание"
 *
 * <AuditActionBadge action="DELETE" />
 * // Renders: Red badge with "Удаление"
 * ```
 */
export function AuditActionBadge({ action, className }: AuditActionBadgeProps) {
  const config = ACTION_CONFIG[action]

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
 * Get action configuration for external use
 * Useful for legends or other UI elements
 */
export function getActionConfig(action: AuditAction) {
  return ACTION_CONFIG[action]
}

/**
 * Get all available actions for filters
 */
export function getAllActions(): AuditAction[] {
  return ['UPDATE', 'CREATE', 'DELETE']
}
