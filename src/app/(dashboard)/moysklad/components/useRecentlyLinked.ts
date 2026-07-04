'use client'

/**
 * In-memory set of mapping ids linked this session (M5 — COGS-recalc visibility).
 * Contract: docs/epics/epic-moysklad-order-management.md (story M5).
 *
 * Purely client-side visibility state — NO backend signal. A row enters the set
 * on `useLinkMapping` success and leaves it on the next sync completion. The
 * "sync completed" signal is the active mappings query's `dataUpdatedAt` bumping:
 * `useMoyskladSync` invalidates `['moysklad','mappings']` on terminal, which
 * refetches the active view and advances `dataUpdatedAt`. This crosses the
 * component boundary (the SyncButton lives on the Overview tab, the table on the
 * mappings tab — both share the query cache, not hook state).
 *
 * Anti-pattern #8: the badge guards on `buyPriceRub != null` at the row; this
 * hook only tracks ids (price may still be null while the recalc is pending).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseRecentlyLinkedResult {
  isRecent: (id: string) => boolean
  markLinked: (id: string) => void
  /** Test-only: current size of the set. */
  size: number
}

/**
 * @param dataUpdatedAt active mappings query's `dataUpdatedAt` (ms epoch).
 *   A bump after the set is non-empty = a sync just refreshed mappings → clear.
 */
export function useRecentlyLinked(dataUpdatedAt: number): UseRecentlyLinkedResult {
  const [ids, setIds] = useState<Set<string>>(() => new Set())
  // Last observed dataUpdatedAt. Only bumps matter; the initial value is ignored.
  const prevUpdatedAt = useRef<number>(dataUpdatedAt)

  useEffect(() => {
    if (dataUpdatedAt === prevUpdatedAt.current) return
    prevUpdatedAt.current = dataUpdatedAt
    // Clear on the first refresh AFTER links were recorded (AC #3).
    setIds(prev => (prev.size > 0 ? new Set() : prev))
  }, [dataUpdatedAt])

  const markLinked = useCallback((id: string) => {
    setIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const isRecent = useCallback((id: string) => ids.has(id), [ids])

  return { isRecent, markLinked, size: ids.size }
}
