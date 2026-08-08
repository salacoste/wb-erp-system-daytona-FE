/**
 * NEW-2 — Communications API client (read-only PR1).
 *
 * Read-only live proxy to BE CommunicationsController
 * (src/communications/controllers/communications.controller.ts). All endpoints
 * require auth + X-Cabinet-Id (auto-injected by apiClient). Responses are BARE
 * objects/arrays; apiClient auto-unwraps `{ data }` where present.
 *
 * The gated write-side (reply/answer/send/pin) is a separate PR — do NOT add
 * mutation endpoints here.
 */

import { apiClient } from '../api-client'
import {
  normalizeFeedbacksResult,
  normalizeQuestionsResult,
  normalizeChatsListResult,
  normalizeChatThreadResult,
  normalizeClaimsResult,
  normalizeUnreadBadge,
  normalizePinnedReviewsResult,
} from './communications-normalizer'
import type {
  FeedbacksQuery,
  QuestionsQuery,
  ClaimsQuery,
  PinnedFeedbacksQuery,
  FeedbacksResult,
  QuestionsResult,
  ChatsListResult,
  ChatThreadResult,
  ClaimsResult,
  UnreadBadge,
  PinnedReviewsResult,
} from '@/types/communications'

/** GET /v1/communications/feedbacks — WB seller feedbacks (filterable). */
export async function getFeedbacks(query: FeedbacksQuery = {}): Promise<FeedbacksResult> {
  const qs = buildFeedbacksQuery(query)
  const endpoint = `/v1/communications/feedbacks${qs ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  return normalizeFeedbacksResult(raw)
}

/** GET /v1/communications/questions — WB product questions (filterable). */
export async function getQuestions(query: QuestionsQuery = {}): Promise<QuestionsResult> {
  const qs = buildQuestionsQuery(query)
  const endpoint = `/v1/communications/questions${qs ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  return normalizeQuestionsResult(raw)
}

/**
 * GET /v1/communications/chats — chat threads list (no chatId) OR a single
 * thread + its messages (with chatId). The response shape differs by branch.
 *
 * An empty-string chatId collapses to list mode (same cache entry as undefined)
 * so `''` and `undefined` never split the threads-list query across two entries.
 */
export async function getChats(chatId?: string): Promise<ChatsListResult | ChatThreadResult> {
  const id = chatId || undefined
  const qs = new URLSearchParams()
  if (id) qs.set('chatId', id)
  const endpoint = `/v1/communications/chats${qs.toString() ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  // chatId branch → { thread, messages }; list branch → { threads }.
  return id ? normalizeChatThreadResult(raw) : normalizeChatsListResult(raw)
}

/** GET /v1/communications/claims — WB seller claims (filterable by status). */
export async function getClaims(query: ClaimsQuery = {}): Promise<ClaimsResult> {
  const qs = buildClaimsQuery(query)
  const endpoint = `/v1/communications/claims${qs ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  return normalizeClaimsResult(raw)
}

/** GET /v1/communications/unread — unread badge flags (feedbacks + questions). */
export async function getUnread(): Promise<UnreadBadge> {
  const raw = await apiClient.get<unknown>('/v1/communications/unread')
  return normalizeUnreadBadge(raw)
}

/**
 * GET /v1/communications/feedbacks/pinned — live SDK passthrough (keeps `data`).
 *
 * `skipDataUnwrap` is REQUIRED: this endpoint returns `{ data: PinnedReviewItem[],
 * next }`, and apiClient auto-unwraps `rawData.data ?? rawData` on every response
 * (api-client.ts:103). Without the flag, the `data` array would be hoisted out
 * of the envelope and the normalizer would see `.data` = undefined → empty list.
 */
export async function getPinnedFeedbacks(
  query: PinnedFeedbacksQuery = {}
): Promise<PinnedReviewsResult> {
  const qs = buildPinnedQuery(query)
  const endpoint = `/v1/communications/feedbacks/pinned${qs ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint, { skipDataUnwrap: true })
  return normalizePinnedReviewsResult(raw)
}

// ---------------------------------------------------------------------------
// Query-string builders (forward only defined / non-empty values)
// ---------------------------------------------------------------------------

/**
 * Forward a param only when it is defined, non-null, and non-empty. Shared by
 * all four builders so the "skip missing" rule lives in ONE place (DRY).
 */
function addIfDefined(qs: URLSearchParams, key: string, value: unknown): void {
  if (value !== undefined && value !== null && value !== '') qs.set(key, String(value))
}

/** Build the feedbacks query string, forwarding only defined params. */
function buildFeedbacksQuery(query: FeedbacksQuery): string {
  const qs = new URLSearchParams()
  addIfDefined(qs, 'isUnanswered', query.isUnanswered)
  addIfDefined(qs, 'nmId', query.nmId)
  addIfDefined(qs, 'take', query.take)
  return qs.toString()
}

/** Build the questions query string, forwarding only defined params. */
function buildQuestionsQuery(query: QuestionsQuery): string {
  const qs = new URLSearchParams()
  addIfDefined(qs, 'isUnanswered', query.isUnanswered)
  addIfDefined(qs, 'nmId', query.nmId)
  return qs.toString()
}

/** Build the claims query string, forwarding only a non-empty status. */
function buildClaimsQuery(query: ClaimsQuery): string {
  const qs = new URLSearchParams()
  addIfDefined(qs, 'status', query.status)
  return qs.toString()
}

/** Build the pinned-reviews query string, forwarding only a defined nmId. */
function buildPinnedQuery(query: PinnedFeedbacksQuery): string {
  const qs = new URLSearchParams()
  addIfDefined(qs, 'nmId', query.nmId)
  return qs.toString()
}
