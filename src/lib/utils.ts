/**
 * General utility functions
 *
 * Formatters (formatCurrency, formatPercentage, etc.) live in @/lib/formatters
 * and are re-exported here for backward compatibility.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Re-export all formatters from the extracted module for backward compatibility.
// New consumers may import directly from '@/lib/formatters'.
export {
  formatCurrency,
  formatPercentage,
  formatPercentageInt,
  formatDate,
  formatDateTime,
  formatIsoWeek,
  formatRoas,
  formatPercentagePoints,
  formatNumber,
  formatDecimal,
  formatWeeksAgo,
  formatWeeksAgoShort,
} from './formatters'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cookie management utilities for authentication
 * Middleware runs on server and cannot access localStorage, so we use cookies
 */

/**
 * Set authentication token cookie
 * @param token - JWT token string
 * @param expiresInHours - Expiration time in hours (default: 24)
 */
export function setAuthCookie(token: string, expiresInHours = 24): void {
  if (typeof document === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + expiresInHours * 60 * 60 * 1000)
  document.cookie = `auth-token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Remove authentication token cookie
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return

  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
}
