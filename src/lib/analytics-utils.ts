/**
 * Analytics Utility Functions
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Helper functions for SLA status colors, velocity status colors, and duration formatting.
 */

// ============================================================================
// SLA Status Colors
// ============================================================================

/**
 * Get SLA compliance status color based on percentage
 * - Green: >= 95% (Excellent)
 * - Yellow: 85-94% (Warning)
 * - Red: < 85% (Critical)
 */
export function getSlaStatusColor(percent: number): string {
  if (percent >= 95) return 'text-green-600'
  if (percent >= 85) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get SLA compliance background color for badges
 */
export function getSlaStatusBgColor(percent: number): string {
  if (percent >= 95) return 'bg-green-50'
  if (percent >= 85) return 'bg-yellow-50'
  return 'bg-red-50'
}

/**
 * Get SLA status label
 */
export function getSlaStatusLabel(percent: number): string {
  if (percent >= 95) return 'Отлично'
  if (percent >= 85) return 'Внимание'
  return 'Критично'
}

// ============================================================================
// Velocity Status Colors
// ============================================================================

/**
 * Get confirmation time color based on minutes
 * - Green: < 30 min (Fast)
 * - Yellow: 30-59 min (Acceptable)
 * - Red: >= 60 min (Slow)
 */
export function getConfirmationTimeColor(minutes: number): string {
  if (minutes < 30) return 'text-green-600'
  if (minutes < 60) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get completion time color based on minutes
 * - Green: < 180 min / 3h (Fast)
 * - Yellow: 180-359 min / 3-6h (Acceptable)
 * - Red: >= 360 min / 6h+ (Slow)
 */
export function getCompletionTimeColor(minutes: number): string {
  if (minutes < 180) return 'text-green-600'
  if (minutes < 360) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get velocity status color based on type and minutes
 */
export function getVelocityStatusColor(minutes: number, type: 'confirm' | 'complete'): string {
  return type === 'confirm' ? getConfirmationTimeColor(minutes) : getCompletionTimeColor(minutes)
}

/**
 * Get velocity status label
 */
export function getVelocityStatusLabel(minutes: number, type: 'confirm' | 'complete'): string {
  const thresholds = type === 'confirm' ? { fast: 30, slow: 60 } : { fast: 180, slow: 360 }

  if (minutes < thresholds.fast) return 'Быстро'
  if (minutes < thresholds.slow) return 'Приемлемо'
  return 'Медленно'
}

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Format minutes into human-readable Russian duration
 * Examples: "35 мин", "2 ч 15 мин", "1 д 4 ч"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} мин`
  }

  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours < 24) {
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days} д ${remainingHours} ч`
}

/**
 * Format minutes into short duration (no seconds)
 * Examples: "35 мин", "2 ч", "1 д"
 */
export function formatDurationShort(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} мин`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} ч`
  }

  const days = Math.floor(hours / 24)
  return `${days} д`
}

// ============================================================================
// Countdown Colors
// ============================================================================

/**
 * Get countdown timer color based on minutes remaining
 * - Red: breached (negative)
 * - Orange: < 10 min
 * - Yellow: < 30 min
 * - Default: >= 30 min
 */
export function getCountdownColor(minutesRemaining: number): string {
  if (minutesRemaining < 0) return 'text-red-600'
  if (minutesRemaining < 10) return 'text-orange-600'
  if (minutesRemaining < 30) return 'text-yellow-600'
  return 'text-gray-600'
}

// ============================================================================
// Russian Plural Forms
// ============================================================================

/**
 * Get correct Russian plural form for "заказ" (order)
 */
export function getOrdersPlural(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} заказов`
  }
  if (lastDigit === 1) {
    return `${count} заказ`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} заказа`
  }
  return `${count} заказов`
}
