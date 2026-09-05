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
 * Hex `color` is the chart discriminator (out of wave-5 scope); bgClass/
 * textClass palette → semantic status tokens (P2 wave-5, production-dead
 * Tailwind channels). Fallbacks map to the muted idiom (canon #6).
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  complete: {
    label: 'Выполнено',
    color: '#22C55E', // Green
    bgClass: 'bg-status-success',
    textClass: 'text-status-success',
  },
  confirm: {
    label: 'Подтверждено',
    color: '#3B82F6', // Blue
    bgClass: 'bg-status-information',
    textClass: 'text-status-information',
  },
  new: {
    label: 'Новый',
    color: '#F59E0B', // Yellow/Amber
    bgClass: 'bg-status-warning',
    textClass: 'text-status-warning',
  },
  cancel: {
    label: 'Отменено',
    color: '#EF4444', // Red
    bgClass: 'bg-status-error',
    textClass: 'text-status-error',
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
  return ORDER_STATUS_CONFIG[status]?.bgClass ?? 'bg-muted'
}

/**
 * Get text class for order status
 */
export function getStatusTextClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.textClass ?? 'text-muted-foreground'
}

/**
 * Fixed order for status display (most positive to most negative)
 */
export const STATUS_ORDER: OrderStatus[] = ['complete', 'confirm', 'new', 'cancel']
