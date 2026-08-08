/**
 * NEW-2 — Communications write-side types (PR2).
 *
 * Mirrors the BE write-back contract:
 *   - All write routes return HTTP 202 `{ jobId, status }` (BullMQ enqueued state).
 *   - The gate (JwtAuthGuard + CabinetGuard + assertWritablePublic) returns 403
 *     when write-back is disabled / not armed / token missing — the FE surfaces
 *     this as a clear RU "disabled" message, not a generic crash.
 *   - GET /writeback/jobs/:jobId returns `{ jobId, status, result, error }` where
 *     `status` is a BullMQ state string (`completed`/`failed`/`active`/`waiting`/…).
 *
 * `confirmationToken` is PRESENCE-ONLY (non-empty string) — the FE rotates a
 * fresh token per user gesture (crypto.randomUUID). It is NOT a secret.
 *
 * Reference: src/communications/dto/communications-writeback.dto.ts +
 * src/communications/helpers/communications-writeback-enqueue.helper.ts
 * (EnqueueResponse).
 */

/** 202 Accepted body returned by the async write endpoints (BullMQ enqueued state). */
export interface WritebackJobEnqueued {
  jobId: string
  status: string
}

/** GET /v1/communications/writeback/jobs/:jobId response (BullMQ job snapshot). */
export interface WritebackJobStatus {
  jobId: string
  /** BullMQ state string: completed | failed | active | waiting | delayed | ... */
  status: string
  /** Job returnvalue (null until completed). Opaque — the FE only checks status. */
  result: unknown
  /** failedReason (null unless failed). */
  error: string | null
}

/** POST /feedbacks/:feedbackId/reply + PATCH /feedbacks/:feedbackId/reply body. */
export interface FeedbackReplyArgs {
  /** Seller answer text body (≤3000). */
  text: string
}

/** POST /questions/:questionId/answer body (all optional except the token). */
export interface QuestionAnswerArgs {
  /** Answer text (optional when only flipping status/wasViewed). */
  answer?: string
  /** WB question status code. */
  status?: number
  /** Mark the question as viewed. */
  wasViewed?: boolean
}

/** POST /chats/messages body (replySign is the WB handshake; no :chatId). */
export interface SendChatMessageArgs {
  /** WB replySign sourced from the chat thread (WbChatThread.replySign). */
  replySign: string
  /** Seller message text body (≤3000). */
  message: string
}

/** Structured pin/unpin target body forwarded opaquely to the WB SDK. */
export interface PinTargetBody {
  /** WB feedback/review id targeted by the pin/unpin. */
  id: string
}

/** POST /feedbacks/:feedbackId/pin body. */
export interface PinFeedbackArgs {
  /** Opaque PinnedReviewsCreateRequest body fragment (minimal { id }). */
  pinData: PinTargetBody
}

/** DELETE /feedbacks/:feedbackId/pin body. */
export interface UnpinFeedbackArgs {
  /** Opaque PinnedReviewsDeleteRequest body fragment (minimal { id }). */
  unpinData: PinTargetBody
}

/**
 * The six gated public write actions (mirrors the BE action union). Used for
 * logging/labels and to type the per-action hook set.
 */
export type WritebackAction =
  | 'reply_feedback'
  | 'update_feedback_reply'
  | 'answer_question'
  | 'send_chat'
  | 'pin_feedback'
  | 'unpin_feedback'

// ---------------------------------------------------------------------------
// Status predicates — SINGLE SOURCE OF TRUTH is src/lib/communications-writeback-utils.ts
// (Finding 13). Re-exported here only for backwards-compatible import paths.
// The allowlist (POLLING_WRITEBACK_STATES) + isWritebackPolling live there so
// behavior and wire-shape types don't drift apart.
// ---------------------------------------------------------------------------

export {
  POLLING_WRITEBACK_STATES,
  COMPLETED_WRITEBACK_STATES,
  isWritebackPolling,
  isWritebackCompleted,
} from '@/lib/communications-writeback-utils'
