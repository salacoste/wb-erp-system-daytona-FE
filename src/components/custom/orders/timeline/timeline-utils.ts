/**
 * Timeline Utility Functions
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Shared utility functions for timeline components.
 */

import type { FullHistoryEntry, WbHistoryEntry } from '@/types/orders-history'
import type { WbStatusCategory } from '@/lib/wb-status-mapping'
import { getWbStatusCategory } from '@/lib/wb-status-mapping'

/**
 * Format ISO timestamp to Russian date format: DD.MM.YYYY HH:mm
 */
export function formatHistoryTimestamp(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Calculate duration between two entries in minutes
 */
export function calculateDurationBetween(
  entries: FullHistoryEntry[],
  currentIndex: number
): number | null {
  if (currentIndex >= entries.length - 1) return null

  const current = new Date(entries[currentIndex].timestamp)
  const next = new Date(entries[currentIndex + 1].timestamp)

  return Math.round((next.getTime() - current.getTime()) / 60000)
}

/**
 * Sort entries chronologically (oldest first)
 */
export function sortEntriesChronologically<
  T extends { timestamp?: string; wbStatusChangedAt?: string; changedAt?: string },
>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const timeA = a.timestamp ?? a.wbStatusChangedAt ?? a.changedAt ?? ''
    const timeB = b.timestamp ?? b.wbStatusChangedAt ?? b.changedAt ?? ''
    return new Date(timeA).getTime() - new Date(timeB).getTime()
  })
}

/**
 * Group WB history entries by category
 */
export interface CategoryGroup {
  category: WbStatusCategory
  entries: WbHistoryEntry[]
}

export function groupWbEntriesByCategory(entries: WbHistoryEntry[]): CategoryGroup[] {
  const groups = new Map<WbStatusCategory, WbHistoryEntry[]>()

  for (const entry of entries) {
    const category = getWbStatusCategory(entry.wbStatusCode)
    const existing = groups.get(category) ?? []
    groups.set(category, [...existing, entry])
  }

  // Return in chronological order of first entry in each category
  const result: CategoryGroup[] = []
  const seenCategories = new Set<WbStatusCategory>()

  for (const entry of entries) {
    const category = getWbStatusCategory(entry.wbStatusCode)
    if (!seenCategories.has(category)) {
      seenCategories.add(category)
      result.push({
        category,
        entries: groups.get(category) ?? [],
      })
    }
  }

  return result
}

/**
 * Get first and last timestamps from entries
 */
export function getTimeSpan(entries: FullHistoryEntry[]): {
  first: string | null
  last: string | null
} {
  if (entries.length === 0) return { first: null, last: null }

  const sorted = sortEntriesChronologically(entries)
  return {
    first: sorted[0].timestamp,
    last: sorted[sorted.length - 1].timestamp,
  }
}

/**
 * Count entries by source
 */
export function countEntriesBySource(entries: FullHistoryEntry[]): {
  wbCount: number
  localCount: number
  total: number
} {
  const wbCount = entries.filter(e => e.source === 'wb_native').length
  const localCount = entries.filter(e => e.source === 'local').length
  return { wbCount, localCount, total: entries.length }
}
