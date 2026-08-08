/**
 * NEW-2 — Communications (Feedbacks / Questions / Chats / Claims) FE-canonical types.
 *
 * Mirrors the FE-facing shapes returned by the BE CommunicationsController
 * (src/communications/controllers/communications.controller.ts). The BE persists
 * WB payloads via Prisma and returns BARE objects/arrays (no `{ data }` envelope
 * for the list endpoints); `apiClient` auto-unwraps `{ data }` where present.
 *
 * Contract (verified against the brief):
 *   - GET /v1/communications/feedbacks      → FeedbacksResult
 *   - GET /v1/communications/questions      → QuestionsResult
 *   - GET /v1/communications/chats          → ChatsListResult | ChatThreadResult
 *   - GET /v1/communications/claims         → ClaimsResult
 *   - GET /v1/communications/unread         → UnreadBadge
 *   - GET /v1/communications/feedbacks/pinned → PinnedReviewsResult
 *
 * AP#8: nullable value fields (rating, counts-of-value) stay `number | null` —
 * null renders '—', never collapses to 0. Only `total`/`unansweredCount`/
 * `unreadCount`/pagination use counts (legit `?? 0`). `nmId` is an opaque
 * numeric id — render with `String(nmId)` (AP#10), never `formatNumber`.
 */

/** Direction of a chat message (WB contract). */
export type ChatMessageDirection = 'client' | 'seller' | 'wb'

/** A WB seller feedback (review). All optional fields are nullable per Prisma. */
export interface WbFeedback {
  id: string
  cabinetId: string
  feedbackId: string
  /** Opaque numeric WB id — display with String(nmId) (AP#10). */
  nmId: number | null
  /** WB product id (string). */
  productId: string | null
  /** Rating 1..5 (int). Nullable — AP#8: null renders '—'. */
  rating: number | null
  text: string | null
  /** Seller's answer text (empty until answered — PR2 write-side). */
  answer: string | null
  isAnswered: boolean | null
  /** WB-side creation timestamp (ISO 8601). */
  createdAt: string | null
  updatedAt: string
}

/** A WB product question. All optional fields are nullable per Prisma. */
export interface WbQuestion {
  id: string
  cabinetId: string
  questionId: string
  /** Opaque numeric WB id — display with String(nmId) (AP#10). */
  nmId: number | null
  text: string | null
  /** Seller's answer text (empty until answered — PR2 write-side). */
  answer: string | null
  /** WB question status (free-text from WB, e.g. "0"/"1"). */
  status: string | null
  isAnswered: boolean | null
  createdAt: string | null
  updatedAt: string
}

/** A chat thread (conversation) summary. */
export interface WbChatThread {
  id: string
  cabinetId: string
  chatId: string
  replySign: string | null
  lastMessagePreview: string | null
  /** Unread message count (count — legit ?? 0). */
  unreadCount: number | null
  updatedAt: string | null
  createdAt: string
}

/** A single chat message within a thread. */
export interface WbChatMessage {
  id: string
  cabinetId: string
  chatId: string
  messageId: string
  text: string | null
  direction: ChatMessageDirection | null
  createdAt: string | null
  updatedAt: string
}

/** A WB seller claim (dispute/рекламация). All optional fields are nullable. */
export interface WbClaim {
  id: string
  cabinetId: string
  claimId: string
  /** Opaque numeric WB id — display with String(nmId) (AP#10). */
  nmId: number | null
  orderId: string | null
  /** WB claim status (free-text from WB). */
  status: string | null
  createdAt: string | null
  updatedAt: string
}

/**
 * Live SDK passthrough item for pinned reviews (feedbacks/pinned endpoint).
 *
 * Mirrors the SDK `PinnedReviewItemResult` (the BE `getPinnedFeedbacks` is a
 * bare `return resp` passthrough). `pinOn` is the LOCATION of the pin
 * (`'nm'` = product card, `'imt'` = merged-card group) — NOT a date. The date
 * of the pin/unpin operation is `changeStateAt`. `unpinnedCause` is present
 * only when `state === 'unpinned'`. Fields are defensively nullable (the
 * normalizer guards at the boundary).
 */
export interface PinnedReviewItem {
  /** WB review id. */
  feedbackId: string | null
  /** 'pinned' | 'unpinned' (WB contract). */
  state: string | null
  /** Location of the pin: 'nm' (product card) | 'imt' (merged-card group). */
  pinOn: string | null
  /** How it was pinned: 'subscription' | 'tariff'. */
  pinMethod: string | null
  /** ISO datetime of the pin/unpin operation. */
  changeStateAt: string | null
  /** WB article (opaque — display via String(), AP#10). */
  nmId: number | null
  /** Merged-card group id. */
  imtId: number | null
  /** Pin operation id. */
  pinId: number | null
  /** Present only when state === 'unpinned' (why WB unpinned it). */
  unpinnedCause: string | null
}

/** GET /v1/communications/feedbacks response (bare object). */
export interface FeedbacksResult {
  rows: WbFeedback[]
  total: number
  unansweredCount: number
}

/** GET /v1/communications/questions response (bare object). */
export interface QuestionsResult {
  rows: WbQuestion[]
  total: number
}

/** GET /v1/communications/chats (no chatId) response. */
export interface ChatsListResult {
  threads: WbChatThread[]
}

/** GET /v1/communications/chats?chatId= response (single thread + messages). */
export interface ChatThreadResult {
  thread: WbChatThread | null
  messages: WbChatMessage[]
}

/** GET /v1/communications/claims response (bare object). */
export interface ClaimsResult {
  rows: WbClaim[]
  total: number
}

/** GET /v1/communications/unread response (badge flags). */
export interface UnreadBadge {
  hasNewFeedbacks: boolean
  hasNewQuestions: boolean
}

/** GET /v1/communications/feedbacks/pinned response (live SDK passthrough). */
export interface PinnedReviewsResult {
  data: PinnedReviewItem[]
  /** Cursor for the next page (optional, WB-driven). */
  next: number | null
}

/** Query params for GET /v1/communications/feedbacks. */
export interface FeedbacksQuery {
  isUnanswered?: boolean
  nmId?: number
  take?: number
}

/** Query params for GET /v1/communications/questions. */
export interface QuestionsQuery {
  isUnanswered?: boolean
  nmId?: number
}

/** Query params for GET /v1/communications/claims. */
export interface ClaimsQuery {
  status?: string
}

/** Query params for GET /v1/communications/feedbacks/pinned. */
export interface PinnedFeedbacksQuery {
  nmId?: number
}
