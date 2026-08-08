/**
 * Boundary normalizer for NEW-2 Communications (NEW normalizer category).
 *
 * The BE persists WB payloads via Prisma and returns BARE camelCase objects/
 * arrays. This normalizer defends at the boundary (Boundary Normalizer Pattern):
 * value fields (rating, nmId, counts) preserve null (AP#8 — render '—'), string
 * fields reject non-string coercion (Defensive Frontend), and arrays are guarded
 * against non-array bodies. Counts/totals use `toCount` (legit ?? 0).
 *
 * Reference: src/communications/controllers/communications.controller.ts.
 */

import {
  asRecord,
  toCount,
  toNullableNumber,
  toStringOrNull,
  toStr,
} from '@/lib/api/normalizer-helpers'
import type {
  WbFeedback,
  WbQuestion,
  WbChatThread,
  WbChatMessage,
  WbClaim,
  PinnedReviewItem,
  FeedbacksResult,
  QuestionsResult,
  ChatsListResult,
  ChatThreadResult,
  ClaimsResult,
  UnreadBadge,
  PinnedReviewsResult,
  ChatMessageDirection,
} from '@/types/communications'

/** Coerce to boolean | null. Non-boolean → null (defensive). */
function toNullableBool(raw: unknown): boolean | null {
  return typeof raw === 'boolean' ? raw : null
}

/** Coerce a chat message direction to the canonical union, else null. */
function toDirection(raw: unknown): ChatMessageDirection | null {
  if (raw === 'client' || raw === 'seller' || raw === 'wb') return raw
  return null
}

/** Normalize a single WbFeedback. Value fields preserve null (AP#8). */
export function normalizeFeedback(raw: unknown): WbFeedback {
  const f = asRecord(raw)
  return {
    id: toStr(f.id),
    cabinetId: toStr(f.cabinetId),
    feedbackId: toStr(f.feedbackId),
    nmId: toNullableNumber(f.nmId),
    productId: toStringOrNull(f.productId),
    rating: toNullableNumber(f.rating),
    text: toStringOrNull(f.text),
    answer: toStringOrNull(f.answer),
    isAnswered: toNullableBool(f.isAnswered),
    createdAt: toStringOrNull(f.createdAt),
    updatedAt: toStr(f.updatedAt),
  }
}

/** Normalize a single WbQuestion. Value fields preserve null (AP#8). */
export function normalizeQuestion(raw: unknown): WbQuestion {
  const q = asRecord(raw)
  return {
    id: toStr(q.id),
    cabinetId: toStr(q.cabinetId),
    questionId: toStr(q.questionId),
    nmId: toNullableNumber(q.nmId),
    text: toStringOrNull(q.text),
    answer: toStringOrNull(q.answer),
    status: toStringOrNull(q.status),
    isAnswered: toNullableBool(q.isAnswered),
    createdAt: toStringOrNull(q.createdAt),
    updatedAt: toStr(q.updatedAt),
  }
}

/** Normalize a single WbChatThread. */
export function normalizeChatThread(raw: unknown): WbChatThread {
  const t = asRecord(raw)
  return {
    id: toStr(t.id),
    cabinetId: toStr(t.cabinetId),
    chatId: toStr(t.chatId),
    replySign: toStringOrNull(t.replySign),
    lastMessagePreview: toStringOrNull(t.lastMessagePreview),
    unreadCount: toNullableNumber(t.unreadCount),
    updatedAt: toStringOrNull(t.updatedAt),
    createdAt: toStr(t.createdAt),
  }
}

/** Normalize a single WbChatMessage. */
export function normalizeChatMessage(raw: unknown): WbChatMessage {
  const m = asRecord(raw)
  return {
    id: toStr(m.id),
    cabinetId: toStr(m.cabinetId),
    chatId: toStr(m.chatId),
    messageId: toStr(m.messageId),
    text: toStringOrNull(m.text),
    direction: toDirection(m.direction),
    createdAt: toStringOrNull(m.createdAt),
    updatedAt: toStr(m.updatedAt),
  }
}

/** Normalize a single WbClaim. Value fields preserve null (AP#8). */
export function normalizeClaim(raw: unknown): WbClaim {
  const c = asRecord(raw)
  return {
    id: toStr(c.id),
    cabinetId: toStr(c.cabinetId),
    claimId: toStr(c.claimId),
    nmId: toNullableNumber(c.nmId),
    orderId: toStringOrNull(c.orderId),
    status: toStringOrNull(c.status),
    createdAt: toStringOrNull(c.createdAt),
    updatedAt: toStr(c.updatedAt),
  }
}

/** Normalize a single PinnedReviewItem (live SDK passthrough). */
export function normalizePinnedReview(raw: unknown): PinnedReviewItem {
  const p = asRecord(raw)
  return {
    feedbackId: toStringOrNull(p.feedbackId),
    state: toStringOrNull(p.state),
    pinOn: toStringOrNull(p.pinOn),
    pinMethod: toStringOrNull(p.pinMethod),
    changeStateAt: toStringOrNull(p.changeStateAt),
    nmId: toNullableNumber(p.nmId),
    imtId: toNullableNumber(p.imtId),
    pinId: toNullableNumber(p.pinId),
    unpinnedCause: toStringOrNull(p.unpinnedCause),
  }
}

// ---------------------------------------------------------------------------
// Response-level normalizers
// ---------------------------------------------------------------------------

/** Normalize GET /v1/communications/feedbacks (bare object). */
export function normalizeFeedbacksResult(raw: unknown): FeedbacksResult {
  const r = asRecord(raw)
  return {
    rows: Array.isArray(r.rows) ? r.rows.map(normalizeFeedback) : [],
    total: toCount(r.total),
    unansweredCount: toCount(r.unansweredCount),
  }
}

/** Normalize GET /v1/communications/questions (bare object). */
export function normalizeQuestionsResult(raw: unknown): QuestionsResult {
  const r = asRecord(raw)
  return {
    rows: Array.isArray(r.rows) ? r.rows.map(normalizeQuestion) : [],
    total: toCount(r.total),
  }
}

/** Normalize GET /v1/communications/chats without chatId (threads list). */
export function normalizeChatsListResult(raw: unknown): ChatsListResult {
  const r = asRecord(raw)
  return {
    threads: Array.isArray(r.threads) ? r.threads.map(normalizeChatThread) : [],
  }
}

/** Normalize GET /v1/communications/chats?chatId= (thread + messages). */
export function normalizeChatThreadResult(raw: unknown): ChatThreadResult {
  const r = asRecord(raw)
  const thread = r.thread == null ? null : normalizeChatThread(r.thread)
  return {
    thread,
    messages: Array.isArray(r.messages) ? r.messages.map(normalizeChatMessage) : [],
  }
}

/** Normalize GET /v1/communications/claims (bare object). */
export function normalizeClaimsResult(raw: unknown): ClaimsResult {
  const r = asRecord(raw)
  return {
    rows: Array.isArray(r.rows) ? r.rows.map(normalizeClaim) : [],
    total: toCount(r.total),
  }
}

/** Normalize GET /v1/communications/unread (badge flags). */
export function normalizeUnreadBadge(raw: unknown): UnreadBadge {
  const r = asRecord(raw)
  return {
    hasNewFeedbacks: toBoolFlag(r.hasNewFeedbacks),
    hasNewQuestions: toBoolFlag(r.hasNewQuestions),
  }
}

/** Boolean flag defaults to false when missing/non-boolean (no new items). */
function toBoolFlag(raw: unknown): boolean {
  return typeof raw === 'boolean' ? raw : false
}

/** Normalize GET /v1/communications/feedbacks/pinned (live SDK passthrough). */
export function normalizePinnedReviewsResult(raw: unknown): PinnedReviewsResult {
  const r = asRecord(raw)
  return {
    data: Array.isArray(r.data) ? r.data.map(normalizePinnedReview) : [],
    next: toNullableNumber(r.next),
  }
}
