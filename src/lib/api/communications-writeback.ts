/**
 * NEW-2 — Communications write-side API client (PR2).
 *
 * Gated proxy to BE CommunicationsWritebackReplyController +
 * CommunicationsWritebackChatPinController. All write routes return HTTP 202
 * `{ jobId, status }` (the BullMQ enqueued-job state — apiClient passes 202
 * bodies through since they have no `.data` key). The 4-factor gate (JwtAuthGuard
 * + CabinetGuard + assertWritablePublic env/arm/token) returns 403 when
 * write-back is disabled — that surfaces as an ApiError(.status === 403) which
 * the hook maps to a RU "disabled" message.
 *
 * `confirmationToken` is PRESENCE-ONLY; the hook rotates a fresh
 * crypto.randomUUID() per user gesture. This module NEVER invents a token — the
 * caller (hook) supplies it so the gesture proof stays at the UI boundary.
 *
 * AP#8: text≤3000 enforced by the BE DTO; the FE form caps input at 3000 chars.
 * No `as`/`any` — let ApiError propagate (the hook reads `.status`).
 *
 * Reference: src/communications/controllers/communications-writeback-*.controller.ts.
 */

import { apiClient } from '../api-client'
import type {
  WritebackJobEnqueued,
  WritebackJobStatus,
  FeedbackReplyArgs,
  QuestionAnswerArgs,
  SendChatMessageArgs,
  PinFeedbackArgs,
  UnpinFeedbackArgs,
} from '@/types/communications/writeback'

/**
 * Forward an optional field onto the body ONLY when it is defined. Shared with
 * answerQuestion so the "skip missing" rule lives in ONE place (DRY, mirrors the
 * addIfDefined query-param helper in src/lib/api/communications.ts).
 */
function addIfDefined(body: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) body[key] = value
}

/** POST /v1/communications/feedbacks/:feedbackId/reply — enqueue a feedback reply (202). */
export async function replyFeedback(
  feedbackId: string,
  args: FeedbackReplyArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  return apiClient.post<WritebackJobEnqueued>(`/v1/communications/feedbacks/${feedbackId}/reply`, {
    text: args.text,
    confirmationToken: token,
  })
}

/** PATCH /v1/communications/feedbacks/:feedbackId/reply — edit an existing reply (202). */
export async function updateFeedbackReply(
  feedbackId: string,
  args: FeedbackReplyArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  return apiClient.patch<WritebackJobEnqueued>(`/v1/communications/feedbacks/${feedbackId}/reply`, {
    text: args.text,
    confirmationToken: token,
  })
}

/**
 * POST /v1/communications/questions/:questionId/answer — answer / update a question (202).
 *
 * Body is built with addIfDefined (shared style, Finding 14). Text length is NOT
 * re-validated here — the ≤3000 cap is enforced at the form boundary (textarea
 * maxLength), matching the BE DTO; behavior is identical to the prior inline form.
 */
export async function answerQuestion(
  questionId: string,
  args: QuestionAnswerArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  const body: Record<string, unknown> = { confirmationToken: token }
  addIfDefined(body, 'answer', args.answer)
  addIfDefined(body, 'status', args.status)
  addIfDefined(body, 'wasViewed', args.wasViewed)
  return apiClient.post<WritebackJobEnqueued>(
    `/v1/communications/questions/${questionId}/answer`,
    body
  )
}

/** POST /v1/communications/chats/messages — send a seller chat message (202, dedup). */
export async function sendChatMessage(
  args: SendChatMessageArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  return apiClient.post<WritebackJobEnqueued>('/v1/communications/chats/messages', {
    replySign: args.replySign,
    message: args.message,
    confirmationToken: token,
  })
}

/** POST /v1/communications/feedbacks/:feedbackId/pin — pin a feedback (202). */
export async function pinFeedback(
  feedbackId: string,
  args: PinFeedbackArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  return apiClient.post<WritebackJobEnqueued>(`/v1/communications/feedbacks/${feedbackId}/pin`, {
    pinData: args.pinData,
    confirmationToken: token,
  })
}

/**
 * DELETE /v1/communications/feedbacks/:feedbackId/pin — unpin a feedback (202).
 *
 * DELETE-with-body: apiClient.delete forwards `options` (a RequestInit) to
 * fetch, so the `{ unpinData, confirmationToken }` JSON body rides in
 * `options.body`. The BE @Body() reads it the same as a POST body.
 */
export async function unpinFeedback(
  feedbackId: string,
  args: UnpinFeedbackArgs,
  token: string
): Promise<WritebackJobEnqueued> {
  return apiClient.delete<WritebackJobEnqueued>(`/v1/communications/feedbacks/${feedbackId}/pin`, {
    body: JSON.stringify({ unpinData: args.unpinData, confirmationToken: token }),
  })
}

/** GET /v1/communications/writeback/jobs/:jobId — poll a write-back job state. */
export async function getWritebackJobStatus(jobId: string): Promise<WritebackJobStatus> {
  return apiClient.get<WritebackJobStatus>(`/v1/communications/writeback/jobs/${jobId}`)
}
