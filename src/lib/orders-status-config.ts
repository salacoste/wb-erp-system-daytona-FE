/**
 * Orders Status Configuration
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Status configuration with Russian labels, colors, and CSS classes.
 * WCAG 2.1 AA compliant colors for accessibility.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

// =============================================================================
// Status Type
// =============================================================================

export type OrderStatus = 'complete' | 'confirm' | 'new' | 'cancel'

// =============================================================================
// Status Configuration
// =============================================================================

export interface StatusConfig {
  /** Russian label for display */
  label: string
  /** Hex color for charts */
  color: string
  /** Tailwind background class */
  bgClass: string
  /** Tailwind text class */
  textClass: string
}

/**
 * Order status configuration with Russian labels and colors
 * Colors meet WCAG 2.1 AA contrast requirements
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  complete: {
    label: 'Выполнено',
    color: '#22C55E', // Green
    bgClass: 'bg-green-500',
    textClass: 'text-green-600',
  },
  confirm: {
    label: 'Подтверждено',
    color: '#3B82F6', // Blue
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-600',
  },
  new: {
    label: 'Новый',
    color: '#F59E0B', // Yellow/Amber
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-600',
  },
  cancel: {
    label: 'Отменено',
    color: '#EF4444', // Red
    bgClass: 'bg-red-500',
    textClass: 'text-red-600',
  },
} as const

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get Russian label for order status
 */
export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.label ?? status
}

/**
 * Get hex color for order status
 */
export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.color ?? '#6B7280'
}

/**
 * Get background class for order status
 */
export function getStatusBgClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.bgClass ?? 'bg-gray-500'
}

/**
 * Get text class for order status
 */
export function getStatusTextClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.textClass ?? 'text-gray-600'
}

/**
 * Fixed order for status display (most positive to most negative)
 */
export const STATUS_ORDER: OrderStatus[] = ['complete', 'confirm', 'new', 'cancel']
