/**
 * LocalStorage utilities for notification state management
 * Used by InitialDataSummary component to track data import notifications
 */

// Storage keys for notification state
const NOTIFICATION_DISMISSED_KEY = 'data-import-notification-dismissed'
const LAST_IMPORT_TIMESTAMP_KEY = 'last-data-import-timestamp'

/**
 * Get the last import timestamp from localStorage
 */
export function getLastImportTimestamp(): number | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(LAST_IMPORT_TIMESTAMP_KEY)
  return stored ? parseInt(stored, 10) : null
}

/**
 * Save the last import timestamp to localStorage
 */
export function saveLastImportTimestamp(timestamp: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_IMPORT_TIMESTAMP_KEY, timestamp.toString())
}

/**
 * Get the dismissed timestamp from localStorage
 */
export function getDismissedTimestamp(): number | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(NOTIFICATION_DISMISSED_KEY)
  return stored ? parseInt(stored, 10) : null
}

/**
 * Save the dismissed timestamp to localStorage
 */
export function saveDismissedTimestamp(timestamp: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATION_DISMISSED_KEY, timestamp.toString())
}

