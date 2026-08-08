/**
 * NEW-2 — Communications write-side React Query hooks (PR2).
 *
 * Six mutations + one job-poll query. Each mutation injects a FRESH
 * `confirmationToken: crypto.randomUUID()` per call — the component passes only
 * the action payload; the token (the 3rd factor of the 4-factor write gate) is
 * the user-gesture proof and rotates per gesture. ApiError propagates so the
 * component can map `.status === 403` to a RU "write-back disabled" message.
 *
 * The mutation does NOT poll — the component captures `data.jobId` from the 202
 * response and feeds it to `usePollWritebackJob(jobId)`, which polls
 * `getWritebackJobStatus` and STOPS (refetchInterval → false) once the BullMQ
 * state is terminal (completed/failed). On terminal the component invalidates
 * the relevant read query + surfaces a toast.
 *
 * Reference: src/lib/api/communications-writeback.ts (contracts) +
 * src/hooks/useImportStatus.ts (refetchInterval pattern).
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  replyFeedback,
  updateFeedbackReply,
  answerQuestion,
  sendChatMessage,
  pinFeedback,
  unpinFeedback,
  getWritebackJobStatus,
} from '@/lib/api/communications-writeback'
import { communicationsQueryKeys } from './useCommunications-utils'
import { isWritebackPolling } from '@/lib/communications-writeback-utils'
import type {
  FeedbackReplyArgs,
  QuestionAnswerArgs,
  SendChatMessageArgs,
  PinFeedbackArgs,
  UnpinFeedbackArgs,
  WritebackJobEnqueued,
  WritebackJobStatus,
} from '@/types/communications/writeback'

/** Query key for the write-back job-poll (per jobId + attempt nonce). */
const writebackJobKey = (jobId: string, attempt: number) =>
  ['communications', 'writeback-job', jobId, attempt] as const

/** Poll interval for a write-back job (1.5s — WB write latency is ~seconds). */
const WRITEBACK_POLL_INTERVAL = 1500

/**
 * Hard deadline for a single write-back poll (Finding 1). Once elapsed the poll
 * STOPS and the job is surfaced as a terminal TIMEOUT so the submit button
 * re-enables and a RU timeout message shows. Guards against a stuck BullMQ job
 * (or a never-recognized state) spinning the poll forever.
 */
export const MAX_POLL_MS = 60_000

/** RU timeout copy surfaced when a write-back poll exceeds MAX_POLL_MS. */
export const WRITEBACK_TIMEOUT_MESSAGE = 'Не удалось проверить статус отправки. Попробуйте ещё раз'

/**
 * The pseudo status surfaced when a poll TIMES OUT (no terminal from BullMQ
 * within MAX_POLL_MS). Components render the RU timeout message for it.
 */
export const WRITEBACK_TIMEOUT_STATUS = 'timeout'

/** Rotate a fresh per-gesture confirmation token (presence-only; not a secret). */
function newConfirmationToken(): string {
  return crypto.randomUUID()
}

/** POST /feedbacks/:feedbackId/reply — enqueue a feedback reply (202). */
export function useReplyFeedback() {
  return useMutation<WritebackJobEnqueued, Error, { feedbackId: string } & FeedbackReplyArgs>({
    mutationFn: ({ feedbackId, text }) =>
      replyFeedback(feedbackId, { text }, newConfirmationToken()),
  })
}

/** PATCH /feedbacks/:feedbackId/reply — edit an existing reply (202). */
export function useUpdateFeedbackReply() {
  return useMutation<WritebackJobEnqueued, Error, { feedbackId: string } & FeedbackReplyArgs>({
    mutationFn: ({ feedbackId, text }) =>
      updateFeedbackReply(feedbackId, { text }, newConfirmationToken()),
  })
}

/** POST /questions/:questionId/answer — answer / update a question (202). */
export function useAnswerQuestion() {
  return useMutation<WritebackJobEnqueued, Error, { questionId: string } & QuestionAnswerArgs>({
    mutationFn: ({ questionId, ...args }) =>
      answerQuestion(questionId, args, newConfirmationToken()),
  })
}

/** POST /chats/messages — send a seller chat message (202). */
export function useSendChatMessage() {
  return useMutation<WritebackJobEnqueued, Error, SendChatMessageArgs>({
    mutationFn: args => sendChatMessage(args, newConfirmationToken()),
  })
}

/** POST /feedbacks/:feedbackId/pin — pin a feedback (202). */
export function usePinFeedback() {
  return useMutation<WritebackJobEnqueued, Error, { feedbackId: string } & PinFeedbackArgs>({
    mutationFn: ({ feedbackId, pinData }) =>
      pinFeedback(feedbackId, { pinData }, newConfirmationToken()),
  })
}

/** DELETE /feedbacks/:feedbackId/pin — unpin a feedback (202). */
export function useUnpinFeedback() {
  return useMutation<WritebackJobEnqueued, Error, { feedbackId: string } & UnpinFeedbackArgs>({
    mutationFn: ({ feedbackId, unpinData }) =>
      unpinFeedback(feedbackId, { unpinData }, newConfirmationToken()),
  })
}

export interface UsePollWritebackJobOptions {
  /** Poll interval (ms); defaults to WRITEBACK_POLL_INTERVAL. */
  interval?: number
}

/**
 * Poll GET /writeback/jobs/:jobId until the BullMQ state is terminal OR the
 * MAX_POLL_MS deadline elapses (Finding 1). STOPS polling (refetchInterval →
 * false) on a terminal state, on a timeout, or before the 202 (jobId null).
 * Keeps polling on active/waiting/delayed/waiting-children only (allowlist).
 *
 * The deadline start is captured in a ref whenever jobId OR the attempt nonce
 * changes (null→set, set→new id, OR a re-submit of the same deterministic id)
 * via an effect; refetchInterval reads it synchronously and returns false once
 * elapsed, flipping a `timedOut` state that is surfaced as terminal so the
 * submit button re-enables + a RU timeout shows.
 *
 * Fast-follow (retry-rearm): `attempt` is a per-submit nonce the coordinator
 * bumps on EVERY setJobId (even when the id is unchanged). It is part of the
 * query key AND the reset-effect deps so re-submitting a deterministic jobId
 * (chat sends — BullMQ dedup) produces a FRESH query and re-arms the poll
 * (resets startedAtRef/timedOut). One-shot callers pass a new id each gesture;
 * the nonce bump is harmless there.
 *
 * Pure query (no side-effects): the component reads `data.status` / `timedOut`
 * and reacts to the terminal transition (Defensive Frontend). No `as`/`!` — the
 * queryFn short-circuits to null when there is no id (Finding 3).
 */
export function usePollWritebackJob(
  jobId: string | null,
  attempt: number,
  options: UsePollWritebackJobOptions = {}
) {
  const { interval = WRITEBACK_POLL_INTERVAL } = options
  const id = jobId
  const startedAtRef = useRef<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  // Capture the poll start when jobId OR the attempt nonce transitions. The
  // nonce bumps on every setJobId, so a re-submit of the same id re-arms here.
  useEffect(() => {
    startedAtRef.current = id ? Date.now() : null
    setTimedOut(false)
  }, [id, attempt])

  const query = useQuery<WritebackJobStatus | null>({
    queryKey: writebackJobKey(id ?? '', attempt),
    queryFn: () => (id ? getWritebackJobStatus(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 0,
    gcTime: 60_000,
    retry: 1,
    refetchInterval: q => {
      const status = q.state.data?.status
      if (!isWritebackPolling(status)) return false
      const startedAt = startedAtRef.current
      if (startedAt !== null && Date.now() - startedAt > MAX_POLL_MS) {
        // Deadline elapsed without a BullMQ terminal → surface as timeout.
        if (!timedOut) setTimedOut(true)
        return false
      }
      return interval
    },
  })
  const status = query.data?.status
  const isTerminal = !!id && (timedOut || (!!status && !isWritebackPolling(status)))
  return {
    ...query,
    isTerminal,
    timedOut,
    /** The status components should act on: the BullMQ state, or the timeout sentinel. */
    effectiveStatus: timedOut ? WRITEBACK_TIMEOUT_STATUS : status,
  }
}

/** Re-export the read-side query keys for invalidation after a successful write. */
export { communicationsQueryKeys }
