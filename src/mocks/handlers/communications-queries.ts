/**
 * MSW handlers for NEW-2 Communications API (read-only PR1).
 *
 * Covers feedbacks, questions, chats (list + single thread), claims, unread, and
 * pinned reviews. State edges driven by `?mode=` query for unit/component tests.
 *
 * BE contract: the BE persists WB payloads via Prisma and returns BARE objects/
 * arrays (no `{ data }` envelope for the list endpoints). Shapes below match the
 * raw backend contract the FE normalizer defends against.
 */

import { http, HttpResponse, delay } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Populated feedback fixture (camelCase — Prisma-serialized). */
export const MOCK_FEEDBACKS = {
  rows: [
    {
      id: 'fb-1',
      cabinetId: 'f75836f7',
      feedbackId: '1001',
      nmId: 12345678,
      productId: 'p-1',
      rating: 5,
      text: 'Отличный товар, быстрая доставка!',
      answer: null,
      isAnswered: false,
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    },
    {
      id: 'fb-2',
      cabinetId: 'f75836f7',
      feedbackId: '1002',
      nmId: null,
      productId: null,
      rating: null,
      text: null,
      answer: null,
      isAnswered: null,
      createdAt: null,
      updatedAt: '2026-08-02T10:00:00Z',
    },
  ],
  total: 2,
  unansweredCount: 2,
}

/** All-null/empty feedbacks fixture (exercises AP#8 — nullable value fields). */
export const MOCK_FEEDBACKS_EMPTY = { rows: [], total: 0, unansweredCount: 0 }

/** Populated questions fixture. */
export const MOCK_QUESTIONS = {
  rows: [
    {
      id: 'q-1',
      cabinetId: 'f75836f7',
      questionId: '2001',
      nmId: 12345678,
      text: 'Есть ли другие цвета?',
      answer: null,
      status: '0',
      isAnswered: false,
      createdAt: '2026-08-01T11:00:00Z',
      updatedAt: '2026-08-01T11:00:00Z',
    },
  ],
  total: 1,
}

/** Empty questions fixture. */
export const MOCK_QUESTIONS_EMPTY = { rows: [], total: 0 }

/** Populated chat threads fixture (list branch). */
export const MOCK_CHATS_LIST = {
  threads: [
    {
      id: 't-1',
      cabinetId: 'f75836f7',
      chatId: 'chat-1',
      replySign: null,
      lastMessagePreview: 'Здравствуйте!',
      unreadCount: 3,
      updatedAt: '2026-08-01T12:00:00Z',
      createdAt: '2026-08-01T11:30:00Z',
    },
  ],
}

/** Populated single-thread fixture (chatId branch). */
export const MOCK_CHAT_THREAD = {
  thread: {
    id: 't-1',
    cabinetId: 'f75836f7',
    chatId: 'chat-1',
    replySign: null,
    lastMessagePreview: 'Спасибо',
    unreadCount: 1,
    updatedAt: '2026-08-01T12:30:00Z',
    createdAt: '2026-08-01T11:30:00Z',
  },
  messages: [
    {
      id: 'm-1',
      cabinetId: 'f75836f7',
      chatId: 'chat-1',
      messageId: 'msg-1',
      text: 'Здравствуйте!',
      direction: 'client',
      createdAt: '2026-08-01T12:00:00Z',
      updatedAt: '2026-08-01T12:00:00Z',
    },
    {
      id: 'm-2',
      cabinetId: 'f75836f7',
      chatId: 'chat-1',
      messageId: 'msg-2',
      text: 'Спасибо',
      direction: 'seller',
      createdAt: '2026-08-01T12:30:00Z',
      updatedAt: '2026-08-01T12:30:00Z',
    },
  ],
}

/** Empty chats fixtures (both branches). */
export const MOCK_CHATS_LIST_EMPTY = { threads: [] }
export const MOCK_CHAT_THREAD_EMPTY = { thread: null, messages: [] }

/** Populated claims fixture. */
export const MOCK_CLAIMS = {
  rows: [
    {
      id: 'cl-1',
      cabinetId: 'f75836f7',
      claimId: '3001',
      nmId: 12345678,
      orderId: 'order-1',
      status: 'open',
      createdAt: '2026-08-01T09:00:00Z',
      updatedAt: '2026-08-01T09:00:00Z',
    },
  ],
  total: 1,
}

/** Empty claims fixture. */
export const MOCK_CLAIMS_EMPTY = { rows: [], total: 0 }

/** Populated unread-badge fixture. */
export const MOCK_UNREAD = { hasNewFeedbacks: true, hasNewQuestions: false }

/** Empty unread-badge fixture (no new items). */
export const MOCK_UNREAD_EMPTY = { hasNewFeedbacks: false, hasNewQuestions: false }

/** Populated pinned-reviews fixture (live SDK passthrough — keeps `data`). */
export const MOCK_PINNED = {
  data: [
    {
      feedbackId: 'fb-1',
      state: 'pinned',
      pinOn: 'nm',
      pinMethod: 'subscription',
      changeStateAt: '2026-07-01T10:00:00Z',
      nmId: 12345678,
      imtId: 99,
      pinId: 5,
    },
    {
      feedbackId: null,
      state: null,
      pinOn: null,
      pinMethod: null,
      changeStateAt: null,
      nmId: null,
      imtId: null,
      pinId: null,
      unpinnedCause: null,
    },
  ],
  next: 2,
}

/** Unpinned-variant fixture (exercises state:'unpinned' + unpinnedCause). */
export const MOCK_PINNED_UNPINNED = {
  data: [
    {
      feedbackId: 'fb-2',
      state: 'unpinned',
      pinOn: 'imt',
      pinMethod: 'tariff',
      changeStateAt: '2026-07-02T10:00:00Z',
      nmId: 12345678,
      imtId: 99,
      pinId: 6,
      unpinnedCause: 'sysLimitReached',
    },
  ],
  next: null,
}

/** Empty pinned-reviews fixture. */
export const MOCK_PINNED_EMPTY = { data: [], next: null }

export const communicationsQueryHandlers = [
  // GET /v1/communications/feedbacks — populated | empty | error (via ?mode=)
  http.get(`${API_BASE_URL}/v1/communications/feedbacks`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Communications sync unavailable' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_FEEDBACKS_EMPTY)
    }
    return HttpResponse.json(MOCK_FEEDBACKS)
  }),

  // GET /v1/communications/questions — populated | empty | error
  http.get(`${API_BASE_URL}/v1/communications/questions`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Questions sync unavailable' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_QUESTIONS_EMPTY)
    }
    return HttpResponse.json(MOCK_QUESTIONS)
  }),

  // GET /v1/communications/chats — list (no chatId) | single thread (chatId)
  http.get(`${API_BASE_URL}/v1/communications/chats`, async ({ request }) => {
    await delay(50)
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Chats sync unavailable' }, { status: 503 })
    }
    const chatId = url.searchParams.get('chatId')
    if (chatId) {
      return HttpResponse.json(mode === 'empty' ? MOCK_CHAT_THREAD_EMPTY : MOCK_CHAT_THREAD)
    }
    return HttpResponse.json(mode === 'empty' ? MOCK_CHATS_LIST_EMPTY : MOCK_CHATS_LIST)
  }),

  // GET /v1/communications/claims — populated | empty | error
  http.get(`${API_BASE_URL}/v1/communications/claims`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Claims sync unavailable' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_CLAIMS_EMPTY)
    }
    return HttpResponse.json(MOCK_CLAIMS)
  }),

  // GET /v1/communications/unread — populated | empty | error
  http.get(`${API_BASE_URL}/v1/communications/unread`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Unread sync unavailable' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_UNREAD_EMPTY)
    }
    return HttpResponse.json(MOCK_UNREAD)
  }),

  // GET /v1/communications/feedbacks/pinned — populated | unpinned | empty | error
  http.get(`${API_BASE_URL}/v1/communications/feedbacks/pinned`, async ({ request }) => {
    await delay(50)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'error') {
      return HttpResponse.json({ message: 'Pinned sync unavailable' }, { status: 503 })
    }
    if (mode === 'empty') {
      return HttpResponse.json(MOCK_PINNED_EMPTY)
    }
    if (mode === 'unpinned') {
      return HttpResponse.json(MOCK_PINNED_UNPINNED)
    }
    return HttpResponse.json(MOCK_PINNED)
  }),
]
