/**
 * Shared string utility functions — Story 120.1-FE.
 *
 * General-purpose string helpers extracted from component files for reuse.
 */

/**
 * Truncate a string to `maxChars` Unicode code points, appending ellipsis if truncated.
 * Uses Array.from for code-point-aware counting (correct for Cyrillic, emoji, etc.).
 *
 * Extracted from funnel-table-columns.tsx (Story 119.2-FE).
 */
export function truncateQuery(q: string, maxChars = 24): string {
  const chars = Array.from(q)
  if (chars.length <= maxChars) return q
  return chars.slice(0, maxChars).join('') + '…'
}
