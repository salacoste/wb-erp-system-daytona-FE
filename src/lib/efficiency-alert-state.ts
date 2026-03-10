/**
 * Efficiency Alert State Management
 * Story 33.4-FE: Efficiency Status Indicators
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Extracted from efficiency-utils.ts for file size compliance.
 * Contains sessionStorage-based alert dismiss state management.
 */

/**
 * Session storage key for dismissed alert banner
 */
export const ALERT_DISMISS_KEY = 'advertising_loss_alert_dismissed'

/**
 * Get stored dismiss state from sessionStorage
 * Returns { dismissed: boolean, lossCount: number | null }
 */
export function getAlertDismissState(): { dismissed: boolean; lossCount: number | null } {
  if (typeof window === 'undefined') {
    return { dismissed: false, lossCount: null }
  }

  try {
    const stored = sessionStorage.getItem(ALERT_DISMISS_KEY)
    if (!stored) {
      return { dismissed: false, lossCount: null }
    }
    const parsed = JSON.parse(stored)
    return {
      dismissed: parsed.dismissed ?? false,
      lossCount: parsed.lossCount ?? null,
    }
  } catch {
    return { dismissed: false, lossCount: null }
  }
}

/**
 * Set dismiss state in sessionStorage
 * Stores both dismissed flag and the loss count at time of dismissal
 */
export function setAlertDismissState(lossCount: number): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(ALERT_DISMISS_KEY, JSON.stringify({ dismissed: true, lossCount }))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear dismiss state from sessionStorage
 */
export function clearAlertDismissState(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(ALERT_DISMISS_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if alert should be shown based on current loss count
 * Alert reappears if loss count increases (AC4)
 */
export function shouldShowLossAlert(currentLossCount: number): boolean {
  if (currentLossCount === 0) return false

  const { dismissed, lossCount: storedCount } = getAlertDismissState()

  // Show if never dismissed
  if (!dismissed) return true

  // Show if loss count increased since dismissal
  if (storedCount !== null && currentLossCount > storedCount) return true

  return false
}
