/**
 * NEW-2 — Communications normalizer boundary tests.
 *
 * Covers nullability (AP#8: value fields → null, not 0), enum coercion
 * (direction), malformed-body guards (non-array → empty), and count handling
 * (total/unansweredCount via toCount — legit 0). Mirrors the finances normalizer
 * test discipline.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFeedback,
  normalizeFeedbacksResult,
  normalizeQuestion,
  normalizeQuestionsResult,
  normalizeChatThread,
  normalizeChatMessage,
  normalizeChatsListResult,
  normalizeChatThreadResult,
  normalizeClaim,
  normalizeClaimsResult,
  normalizeUnreadBadge,
  normalizePinnedReview,
  normalizePinnedReviewsResult,
} from '../communications-normalizer'

describe('normalizeFeedback', () => {
  it('preserves a populated feedback (camelCase, rating as-is)', () => {
    const out = normalizeFeedback({
      id: 'fb-1',
      cabinetId: 'c1',
      feedbackId: '1001',
      nmId: 12345,
      productId: 'p-1',
      rating: 5,
      text: 'ok',
      answer: null,
      isAnswered: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    })
    expect(out).toEqual({
      id: 'fb-1',
      cabinetId: 'c1',
      feedbackId: '1001',
      nmId: 12345,
      productId: 'p-1',
      rating: 5,
      text: 'ok',
      answer: null,
      isAnswered: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    })
  })

  it('preserves null value fields (AP#8 — never collapses to 0)', () => {
    const out = normalizeFeedback({ id: 'fb', cabinetId: 'c', feedbackId: 'f', updatedAt: 'u' })
    expect(out.nmId).toBeNull()
    expect(out.rating).toBeNull()
    expect(out.productId).toBeNull()
    expect(out.text).toBeNull()
    expect(out.isAnswered).toBeNull()
  })

  it('rejects non-number rating and non-boolean isAnswered', () => {
    const out = normalizeFeedback({
      id: 'fb',
      cabinetId: 'c',
      feedbackId: 'f',
      updatedAt: 'u',
      rating: 'abc',
      isAnswered: 'yes',
    })
    expect(out.rating).toBeNull()
    expect(out.isAnswered).toBeNull()
  })

  it('handles a non-object body defensively', () => {
    expect(normalizeFeedback(null).id).toBe('')
    expect(normalizeFeedback('oops').feedbackId).toBe('')
  })
})

describe('normalizeFeedbacksResult', () => {
  it('maps rows and reads counts (total/unanswered via toCount)', () => {
    const out = normalizeFeedbacksResult({
      rows: [{ id: 'fb', cabinetId: 'c', feedbackId: 'f', updatedAt: 'u' }],
      total: 7,
      unansweredCount: 3,
    })
    expect(out.rows).toHaveLength(1)
    expect(out.total).toBe(7)
    expect(out.unansweredCount).toBe(3)
  })

  it('returns [] rows + 0 counts for a non-array / missing body', () => {
    expect(normalizeFeedbacksResult(null)).toEqual({ rows: [], total: 0, unansweredCount: 0 })
    expect(normalizeFeedbacksResult({ rows: 'nope' })).toEqual({
      rows: [],
      total: 0,
      unansweredCount: 0,
    })
  })
})

describe('normalizeQuestion', () => {
  it('preserves a populated question', () => {
    const out = normalizeQuestion({
      id: 'q',
      cabinetId: 'c',
      questionId: 'q1',
      nmId: 9,
      text: 'q',
      answer: 'a',
      status: '1',
      isAnswered: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: 'u',
    })
    expect(out.nmId).toBe(9)
    expect(out.status).toBe('1')
  })

  it('preserves null value fields (AP#8)', () => {
    const out = normalizeQuestion({ id: 'q', cabinetId: 'c', questionId: 'q1', updatedAt: 'u' })
    expect(out.nmId).toBeNull()
    expect(out.status).toBeNull()
    expect(out.isAnswered).toBeNull()
  })
})

describe('normalizeQuestionsResult', () => {
  it('maps rows + total, guards non-array', () => {
    expect(normalizeQuestionsResult({ rows: [], total: 0 })).toEqual({ rows: [], total: 0 })
    expect(normalizeQuestionsResult(null)).toEqual({ rows: [], total: 0 })
  })
})

describe('normalizeChatThread', () => {
  it('preserves unreadCount as nullable (AP#8)', () => {
    const out = normalizeChatThread({ id: 't', cabinetId: 'c', chatId: 'ch', updatedAt: 'u' })
    expect(out.unreadCount).toBeNull()
    expect(out.lastMessagePreview).toBeNull()
  })
})

describe('normalizeChatMessage', () => {
  it('coerces direction to the canonical union, else null', () => {
    expect(
      normalizeChatMessage({
        id: 'm',
        cabinetId: 'c',
        chatId: 'ch',
        messageId: 'mi',
        direction: 'client',
        updatedAt: 'u',
      }).direction
    ).toBe('client')
    expect(
      normalizeChatMessage({
        id: 'm',
        cabinetId: 'c',
        chatId: 'ch',
        messageId: 'mi',
        direction: 'weird',
        updatedAt: 'u',
      }).direction
    ).toBeNull()
    expect(
      normalizeChatMessage({
        id: 'm',
        cabinetId: 'c',
        chatId: 'ch',
        messageId: 'mi',
        updatedAt: 'u',
      }).direction
    ).toBeNull()
  })
})

describe('normalizeChatsListResult / normalizeChatThreadResult', () => {
  it('list branch maps threads, guards non-array', () => {
    expect(normalizeChatsListResult({ threads: [] })).toEqual({ threads: [] })
    expect(normalizeChatsListResult(null)).toEqual({ threads: [] })
  })

  it('thread branch maps messages + thread (null thread → null)', () => {
    const out = normalizeChatThreadResult({ thread: null, messages: [] })
    expect(out.thread).toBeNull()
    expect(out.messages).toEqual([])
    const populated = normalizeChatThreadResult({
      thread: { id: 't', cabinetId: 'c', chatId: 'ch', updatedAt: 'u' },
      messages: [{ id: 'm', cabinetId: 'c', chatId: 'ch', messageId: 'mi', updatedAt: 'u' }],
    })
    expect(populated.thread?.id).toBe('t')
    expect(populated.messages).toHaveLength(1)
  })
})

describe('normalizeClaim', () => {
  it('preserves null value fields (AP#8)', () => {
    const out = normalizeClaim({ id: 'cl', cabinetId: 'c', claimId: 'cl1', updatedAt: 'u' })
    expect(out.nmId).toBeNull()
    expect(out.orderId).toBeNull()
    expect(out.status).toBeNull()
  })
})

describe('normalizeClaimsResult', () => {
  it('maps rows + total, guards non-array', () => {
    expect(normalizeClaimsResult(null)).toEqual({ rows: [], total: 0 })
  })
})

describe('normalizeUnreadBadge', () => {
  it('reads boolean flags', () => {
    expect(normalizeUnreadBadge({ hasNewFeedbacks: true, hasNewQuestions: false })).toEqual({
      hasNewFeedbacks: true,
      hasNewQuestions: false,
    })
  })

  it('defaults non-boolean flags to false (no new items)', () => {
    expect(normalizeUnreadBadge({})).toEqual({ hasNewFeedbacks: false, hasNewQuestions: false })
    expect(normalizeUnreadBadge(null)).toEqual({
      hasNewFeedbacks: false,
      hasNewQuestions: false,
    })
  })
})

describe('normalizePinnedReview / normalizePinnedReviewsResult', () => {
  it('maps the real SDK fields (pinOn=location, changeStateAt=date, no isErrors)', () => {
    const out = normalizePinnedReview({
      feedbackId: 'fb-1',
      state: 'pinned',
      pinOn: 'nm',
      pinMethod: 'subscription',
      changeStateAt: '2026-07-01T10:00:00Z',
      nmId: 12345678,
      imtId: 99,
      pinId: 5,
    })
    expect(out).toEqual({
      feedbackId: 'fb-1',
      state: 'pinned',
      pinOn: 'nm',
      pinMethod: 'subscription',
      changeStateAt: '2026-07-01T10:00:00Z',
      nmId: 12345678,
      imtId: 99,
      pinId: 5,
      unpinnedCause: null,
    })
  })

  it('preserves unpinnedCause for an unpinned item', () => {
    const out = normalizePinnedReview({
      feedbackId: 'fb-2',
      state: 'unpinned',
      pinOn: 'imt',
      pinMethod: 'tariff',
      changeStateAt: '2026-07-02T10:00:00Z',
      nmId: 12345678,
      imtId: 99,
      pinId: 6,
      unpinnedCause: 'sysLimitReached',
    })
    expect(out.state).toBe('unpinned')
    expect(out.unpinnedCause).toBe('sysLimitReached')
  })

  it('preserves null on all fields for an empty body (AP#8)', () => {
    const out = normalizePinnedReview({})
    expect(out).toEqual({
      feedbackId: null,
      state: null,
      pinOn: null,
      pinMethod: null,
      changeStateAt: null,
      nmId: null,
      imtId: null,
      pinId: null,
      unpinnedCause: null,
    })
  })

  it('rejects non-string feedbackId (Defensive Frontend — never coerce blindly)', () => {
    expect(normalizePinnedReview({ feedbackId: 1001 }).feedbackId).toBeNull()
    expect(normalizePinnedReview({ feedbackId: {} }).feedbackId).toBeNull()
  })

  it('keeps the `data` envelope (live SDK passthrough)', () => {
    const out = normalizePinnedReviewsResult({ data: [], next: null })
    expect(out.data).toEqual([])
    expect(out.next).toBeNull()
  })

  it('guards non-array data', () => {
    expect(normalizePinnedReviewsResult(null)).toEqual({ data: [], next: null })
    expect(normalizePinnedReviewsResult({ data: 'nope' })).toEqual({ data: [], next: null })
  })
})
