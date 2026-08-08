/**
 * NEW-7 — Finances query keys + rate-limit-aware config constants.
 *
 * WB rate limits (BE FinancesController, user-driven on-demand):
 *   - balance: 1/min  → staleTime 60s, retry:1, short gcTime
 *   - documents: 1/10s → staleTime 10s
 *   - categories: stable filter options → staleTime 5min
 *
 * Extracted from useFinances.ts for file-size compliance (mirrors
 * useLiquidity-utils.ts).
 */

import type { FinanceDocumentsQuery, DocumentsLocale } from '@/types/finances'

/** Query keys for finances (TanStack v5 factory pattern). */
export const financesQueryKeys = {
  /** Base key for all finances queries. */
  all: ['finances'] as const,
  /** Balance query key (per-cabinet scoping happens via X-Cabinet-Id). */
  balance: () => [...financesQueryKeys.all, 'balance'] as const,
  /** Documents list query key (includes the full query for dedupe). */
  documents: (query: FinanceDocumentsQuery) =>
    [...financesQueryKeys.all, 'documents', query] as const,
  /** Document categories query key (per-locale). */
  categories: (locale?: DocumentsLocale) =>
    [...financesQueryKeys.all, 'categories', locale ?? 'ru'] as const,
}

/**
 * staleTime for balance (60s) — mirrors the WB 1/min rate limit. Re-fetching
 * sooner would hit the WB rate limit and surface a 503 (no fresher data).
 */
export const BALANCE_STALE_TIME = 60_000

/** Short gcTime for balance — money values change, avoid showing stale cache. */
export const BALANCE_GC_TIME = 120_000

/** staleTime for documents (10s) — mirrors the WB 1/10s rate limit. */
export const DOCUMENTS_STALE_TIME = 10_000

/** gcTime for documents (2min) — paginated list, allow back-nav cache hits. */
export const DOCUMENTS_GC_TIME = 120_000

/** staleTime for categories (5min) — stable filter options, rarely change. */
export const CATEGORIES_STALE_TIME = 300_000

/** Default page size for the documents table (WB max 1000). */
export const DEFAULT_PAGE_SIZE = 20
