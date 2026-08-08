/**
 * NEW-2 — Communications React Query hooks (read-only PR1).
 *
 * Each section is an INDEPENDENT query (AC4 multi-source): one failing never
 * blanks the others. All accept `{ enabled }` for cabinet-readiness gating.
 * `retry:1` + `refetchOnWindowFocus:false` mirror the project query convention.
 *
 * The gated write-side (reply/answer/send/pin) is PR2 — no mutations here.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getFeedbacks,
  getQuestions,
  getChats,
  getClaims,
  getUnread,
  getPinnedFeedbacks,
} from '@/lib/api/communications'
import {
  communicationsQueryKeys,
  UNREAD_STALE_TIME,
  LISTS_STALE_TIME,
  COMMUNICATIONS_GC_TIME,
} from './useCommunications-utils'
import type {
  FeedbacksQuery,
  QuestionsQuery,
  ClaimsQuery,
  PinnedFeedbacksQuery,
  ChatsListResult,
  ChatThreadResult,
} from '@/types/communications'

// Re-export query keys for consumers/tests (mirrors useFinances re-export).
export { communicationsQueryKeys } from './useCommunications-utils'

/** Shared hook options (enabled flag for cabinet-readiness gating). */
export interface UseCommunicationsOptions {
  /** Disable the query when the cabinet isn't ready (no auth/cabinet selected). */
  enabled?: boolean
}

/** GET /v1/communications/feedbacks — WB seller feedbacks (filterable). */
export function useFeedbacks(query: FeedbacksQuery = {}, options: UseCommunicationsOptions = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: communicationsQueryKeys.feedbacks(query),
    queryFn: () => getFeedbacks(query),
    enabled,
    staleTime: LISTS_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/communications/questions — WB product questions (filterable). */
export function useQuestions(query: QuestionsQuery = {}, options: UseCommunicationsOptions = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: communicationsQueryKeys.questions(query),
    queryFn: () => getQuestions(query),
    enabled,
    staleTime: LISTS_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/**
 * GET /v1/communications/chats — threads list (no chatId) OR a single thread +
 * messages (with chatId). Returns a discriminated union by branch.
 *
 * Takes a `query` object (matching the sibling `(query, options)` convention);
 * `chatId` collapses to list mode when undefined/'' (no cache split).
 */
export function useChats(query: { chatId?: string } = {}, options: UseCommunicationsOptions = {}) {
  const { enabled = true } = options
  const { chatId } = query
  return useQuery<ChatsListResult | ChatThreadResult>({
    queryKey: communicationsQueryKeys.chats(chatId),
    queryFn: () => getChats(chatId),
    enabled,
    staleTime: LISTS_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/communications/claims — WB seller claims (filterable by status). */
export function useClaims(query: ClaimsQuery = {}, options: UseCommunicationsOptions = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: communicationsQueryKeys.claims(query),
    queryFn: () => getClaims(query),
    enabled,
    staleTime: LISTS_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/communications/unread — unread badge flags (feedbacks + questions). */
export function useUnreadBadge(options: UseCommunicationsOptions = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: communicationsQueryKeys.unread(),
    queryFn: getUnread,
    enabled,
    staleTime: UNREAD_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/communications/feedbacks/pinned — live SDK passthrough. */
export function usePinnedFeedbacks(
  query: PinnedFeedbacksQuery = {},
  options: UseCommunicationsOptions = {}
) {
  const { enabled = true } = options
  return useQuery({
    queryKey: communicationsQueryKeys.pinned(query),
    queryFn: () => getPinnedFeedbacks(query),
    enabled,
    staleTime: LISTS_STALE_TIME,
    gcTime: COMMUNICATIONS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
