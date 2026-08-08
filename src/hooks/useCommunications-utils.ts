/**
 * NEW-2 — Communications query keys + freshness config constants.
 *
 * Extracted from useCommunications.ts for file-size compliance (mirrors
 * useFinances-utils.ts). staleTime/gcTime chosen so TanStack doesn't refetch
 * faster than the WB sync cadence (lists are BE-persisted snapshots).
 *
 *   - unread: ~60s (badge should feel live but not hammer the backend)
 *   - lists:  ~30s (feedbacks/questions/chats/claims/pinned)
 */

import type {
  FeedbacksQuery,
  QuestionsQuery,
  ClaimsQuery,
  PinnedFeedbacksQuery,
} from '@/types/communications'

/** Query keys for communications (TanStack v5 factory pattern). */
export const communicationsQueryKeys = {
  /** Base key for all communications queries. */
  all: ['communications'] as const,
  /** Feedbacks list query key (includes the full query for dedupe). */
  feedbacks: (query: FeedbacksQuery) =>
    [...communicationsQueryKeys.all, 'feedbacks', query] as const,
  /** Questions list query key. */
  questions: (query: QuestionsQuery) =>
    [...communicationsQueryKeys.all, 'questions', query] as const,
  /**
   * Chats query key (per chatId — list vs single thread). `chatId ?? 'list'`
   * collapses both undefined and '' to the same list-mode entry (no cache split).
   */
  chats: (chatId?: string) => [...communicationsQueryKeys.all, 'chats', chatId || 'list'] as const,
  /** Claims list query key. */
  claims: (query: ClaimsQuery) => [...communicationsQueryKeys.all, 'claims', query] as const,
  /** Unread badge query key (single, per-cabinet via X-Cabinet-Id). */
  unread: () => [...communicationsQueryKeys.all, 'unread'] as const,
  /** Pinned reviews query key (per nmId). */
  pinned: (query: PinnedFeedbacksQuery) =>
    [...communicationsQueryKeys.all, 'pinned', query] as const,
}

/** staleTime for the unread badge (60s) — feels live without backend load. */
export const UNREAD_STALE_TIME = 60_000

/** staleTime for list endpoints (30s) — BE-persisted snapshots. */
export const LISTS_STALE_TIME = 30_000

/** gcTime for list/badge queries (2min) — allow back-nav cache hits. */
export const COMMUNICATIONS_GC_TIME = 120_000
