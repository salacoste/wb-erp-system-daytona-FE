/**
 * Story 172.9-FE E2E fixture — route controller for the communications
 * workspace.
 *
 * Pre-registers exact-API-path Playwright routes (no `**` globs) for
 *   GET /v1/communications/feedbacks        (bare {rows, total, unansweredCount})
 *   GET /v1/communications/feedbacks/pinned (bare {data, next} — SDK passthrough)
 *   GET /v1/communications/questions        (bare {rows, total})
 *   GET /v1/communications/chats            (list {threads} | detail {thread, messages})
 *   GET /v1/communications/claims           (bare {rows, total})
 *   GET /v1/communications/unread           (bare {hasNewFeedbacks, hasNewQuestions})
 * and fulfills them from in-memory fixtures (normalizer contract shapes,
 * src/lib/api/communications-normalizer.ts). Per-section status is flippable
 * mid-test (e.g. 500 → 200 for the retry assertion) via setSectionStatus.
 *
 * Modes: 'populated' | 'empty' | 'error'. The chats route discriminates the
 * thread-list vs thread-detail shape by the chatId query parameter.
 *
 * Observable-wait pattern (163.3 canon): the spec pre-registers
 * waitForResponse and asserts toBeVisible terminal states — this controller
 * keeps every fulfillment synchronous except optional latencyMs.
 */
import type { Page, Route } from '@playwright/test'

export type Story1729Mode = 'populated' | 'empty'
export type Story1729Section = 'feedbacks' | 'pinned' | 'questions' | 'chats' | 'claims' | 'unread'

/** Raw feedback rows (pre-normalizer contract shape; values preserve null). */
export const STORY_172_9_FEEDBACKS = {
  rows: [
    {
      id: 'fb-172-9-1',
      cabinetId: 'cab-1',
      feedbackId: '12345',
      nmId: 67890,
      productId: '194927',
      rating: 4,
      text: 'Пришло быстро, качество хорошее',
      answer: null,
      isAnswered: true,
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-21T10:00:00Z',
    },
    {
      id: 'fb-172-9-2',
      cabinetId: 'cab-1',
      feedbackId: '12346',
      nmId: 67891,
      productId: null,
      rating: null,
      text: null,
      answer: null,
      isAnswered: false,
      createdAt: '2026-08-22T10:00:00Z',
      updatedAt: '2026-08-22T10:00:00Z',
    },
  ],
  total: 2,
  unansweredCount: 1,
}

export const STORY_172_9_QUESTIONS = {
  rows: [
    {
      id: 'q-172-9-1',
      cabinetId: 'cab-1',
      questionId: '5511',
      nmId: 67890,
      text: 'Есть ли размер 42?',
      answer: null,
      status: null,
      isAnswered: false,
      createdAt: '2026-08-23T10:00:00Z',
      updatedAt: '2026-08-23T10:00:00Z',
    },
  ],
  total: 1,
}

export const STORY_172_9_THREAD = {
  id: 'th-172-9-1',
  cabinetId: 'cab-1',
  chatId: 'chat-172-9-1',
  replySign: 'sign-token',
  lastMessagePreview: 'Когда ожидать отправку?',
  unreadCount: 3,
  updatedAt: '2026-08-24T12:00:00Z',
  createdAt: '2026-08-01T12:00:00Z',
}

export const STORY_172_9_CHAT_DETAIL = {
  thread: STORY_172_9_THREAD,
  messages: [
    {
      id: 'm-172-9-1',
      cabinetId: 'cab-1',
      chatId: 'chat-172-9-1',
      messageId: '9001',
      text: 'Когда ожидать отправку?',
      direction: 'client',
      createdAt: '2026-08-24T11:00:00Z',
      updatedAt: '2026-08-24T11:00:00Z',
    },
    {
      id: 'm-172-9-2',
      cabinetId: 'cab-1',
      chatId: 'chat-172-9-1',
      messageId: '9002',
      text: 'Отправим сегодня до 18:00',
      direction: 'seller',
      createdAt: '2026-08-24T12:00:00Z',
      updatedAt: '2026-08-24T12:00:00Z',
    },
  ],
}

export const STORY_172_9_CLAIMS = {
  rows: [
    {
      id: 'cl-172-9-1',
      cabinetId: 'cab-1',
      claimId: '77001',
      nmId: 67890,
      orderId: 'A-123',
      status: 'in_progress',
      createdAt: '2026-08-19T09:00:00Z',
      updatedAt: '2026-08-25T09:00:00Z',
    },
  ],
  total: 1,
}

export const STORY_172_9_PINNED = {
  data: [
    {
      feedbackId: '12345',
      state: 'pinned',
      pinOn: 'nm',
      pinMethod: 'app',
      changeStateAt: '2026-08-21T10:00:00Z',
      nmId: 67890,
      imtId: null,
      pinId: 1,
      unpinnedCause: null,
    },
  ],
  next: null,
}

export const STORY_172_9_UNREAD = { hasNewFeedbacks: true, hasNewQuestions: false }

/**
 * Install the route controller. `setSectionStatus` flips one section's
 * response mid-test (retry flows: error → data) without re-registering
 * routes; statuses are consulted at fulfillment time.
 */
export async function installStory1729Routes(
  page: Page,
  mode: Story1729Mode = 'populated'
): Promise<{
  /** Flip one section's status mid-test (e.g. 'feedbacks' 500 → 200). */
  setSectionStatus: (section: Story1729Section, status: 200 | 500) => void
  /** Last URL each section served (wire-contract assertions). */
  getLastUrl: (section: Story1729Section) => string | undefined
}> {
  const statuses: Record<Story1729Section, 200 | 500> = {
    feedbacks: 200,
    pinned: 200,
    questions: 200,
    chats: 200,
    claims: 200,
    unread: 200,
  }
  const lastUrls: Partial<Record<Story1729Section, string>> = {}

  const fulfill = async (route: Route, body: unknown, statusCode = 200) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  const emptyBodies: Record<Story1729Section, unknown> = {
    feedbacks: { rows: [], total: 0, unansweredCount: 0 },
    pinned: { data: [], next: null },
    questions: { rows: [], total: 0 },
    chats: { threads: [] },
    claims: { rows: [], total: 0 },
    unread: { hasNewFeedbacks: false, hasNewQuestions: false },
  }
  const populatedBodies: Record<Story1729Section, unknown> = {
    feedbacks: STORY_172_9_FEEDBACKS,
    pinned: STORY_172_9_PINNED,
    questions: STORY_172_9_QUESTIONS,
    chats: { threads: [STORY_172_9_THREAD] },
    claims: STORY_172_9_CLAIMS,
    unread: STORY_172_9_UNREAD,
  }

  const serve = (section: Story1729Section) => async (route: Route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    lastUrls[section] = route.request().url()
    if (statuses[section] === 500) {
      return fulfill(route, { message: `${section} unavailable` }, 500)
    }
    const body = mode === 'empty' ? emptyBodies[section] : populatedBodies[section]
    return fulfill(route, body)
  }

  // Exact-path regexes; the $-anchored feedbacks pattern cannot collide with
  // the /feedbacks/pinned suffix route (172.2 no-`**`-glob canon).
  await page.route(/\/v1\/communications\/feedbacks\/pinned(\?.*)?$/, serve('pinned'))
  await page.route(/\/v1\/communications\/feedbacks(\?.*)?$/, serve('feedbacks'))
  await page.route(/\/v1\/communications\/questions(\?.*)?$/, serve('questions'))
  await page.route(/\/v1\/communications\/claims(\?.*)?$/, serve('claims'))
  await page.route(/\/v1\/communications\/unread(\?.*)?$/, serve('unread'))
  await page.route(/\/v1\/communications\/chats(\?.*)?$/, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    lastUrls.chats = route.request().url()
    if (statuses.chats === 500) {
      return fulfill(route, { message: 'chats unavailable' }, 500)
    }
    if (mode === 'empty') return fulfill(route, emptyBodies.chats)
    const url = new URL(route.request().url())
    const chatId = url.searchParams.get('chatId')
    const body = chatId ? STORY_172_9_CHAT_DETAIL : { threads: [STORY_172_9_THREAD] }
    return fulfill(route, body)
  })

  return {
    setSectionStatus: (section, status) => {
      statuses[section] = status
    },
    getLastUrl: section => lastUrls[section],
  }
}
