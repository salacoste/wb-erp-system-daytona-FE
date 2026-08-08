'use client'

/**
 * WritebackStatus — NEW-2 shared inline status banner for the 202→poll→terminal
 * write flow (PR2). Renders one of:
 *   - in-flight  → muted "Отправляется…" (job polled, not yet terminal)
 *   - failed     → red error line (the job's failedReason or generic copy)
 *   - 403 gate   → red "Ответы отключены…" (kill-switch — clear RU indicator)
 *   - poll error → red generic line (the POLL errored with no job data —
 *     Finding 11: distinct from a job-failed; rendered as an indication, the
 *     raw BE/English message is NEVER shown — locale policy)
 *
 * Finding 10: non-403 errors render writebackErrorMessage (RU generic) rather
 * than the raw `error.message` (which leaks BE/English to users).
 *
 * Extracted so each write surface (FeedbackRow / QuestionRow / ChatComposer /
 * PinnedRow) stays <200 lines and the kill-switch copy lives in ONE place.
 * No fabrication: an unknown error is indicated, not transformed.
 */

import {
  WRITEBACK_DISABLED_MESSAGE,
  WRITEBACK_INFLIGHT_MESSAGE,
  WRITEBACK_GENERIC_ERROR_MESSAGE,
  isWritebackDisabledError,
  writebackErrorMessage,
} from '@/lib/communications-writeback-utils'
// Import the timeout sentinel + copy from the hook so they are NOT dead code
// (Pass-2 P2-1): on a real MAX_POLL_MS timeout the user sees the RU timeout
// copy, not a generic failure.
import {
  WRITEBACK_TIMEOUT_MESSAGE,
  WRITEBACK_TIMEOUT_STATUS,
} from '@/hooks/useCommunicationsWriteback'

export interface WritebackStatusProps {
  /** True while a mutation is pending OR a job is polling toward terminal. */
  isInflight: boolean
  /** Mutation/poll error (ApiError or Error). Drives the 403 vs generic copy. */
  error: unknown
  /**
   * The job's effective status (BullMQ state OR 'timeout' when the poll exceeded
   * MAX_POLL_MS). When 'timeout' the RU timeout copy is rendered. Forwarded by
   * each coordinator from useWritebackJob.effectiveStatus (Pass-2 P2-1).
   */
  status?: string
  /** Job-level failure reason (BullMQ failedReason) when the poll reached failed. */
  jobError?: string | null
  /** True when the POLL itself errored (no job data) — distinct from job-failed. */
  pollError?: boolean
  /** data-testid hook for component tests. */
  testId?: string
}

/** Render the inline status line (null when idle + no error). */
export function WritebackStatus({
  isInflight,
  error,
  status,
  jobError,
  pollError,
  testId,
}: WritebackStatusProps) {
  if (isWritebackDisabledError(error)) {
    return (
      <p role="alert" className="mt-1 text-xs text-red-600" data-testid={testId}>
        {WRITEBACK_DISABLED_MESSAGE}
      </p>
    )
  }
  if (error) {
    // Finding 10: never leak raw error.message (BE/English) — RU generic copy.
    return (
      <p role="alert" className="mt-1 text-xs text-red-600" data-testid={testId}>
        {writebackErrorMessage(error)}
      </p>
    )
  }
  // Pass-2 P2-1: a poll timeout surfaces the RU timeout copy (distinct from a
  // generic failure) — the acceptance "a RU timeout message shows" is met here.
  if (status === WRITEBACK_TIMEOUT_STATUS) {
    return (
      <p role="alert" className="mt-1 text-xs text-red-600" data-testid={testId}>
        {WRITEBACK_TIMEOUT_MESSAGE}
      </p>
    )
  }
  if (pollError) {
    return (
      <p role="alert" className="mt-1 text-xs text-red-600" data-testid={testId}>
        {WRITEBACK_GENERIC_ERROR_MESSAGE}
      </p>
    )
  }
  if (jobError) {
    // Pass-2 P2-2: render RU generic copy (never the raw BE/English failedReason
    // verbatim); preserve the raw failedReason in the title attr only (Defensive
    // Frontend: indicate + preserve raw, don't dump it as visible text).
    return (
      <p role="alert" className="mt-1 text-xs text-red-600" data-testid={testId} title={jobError}>
        {WRITEBACK_GENERIC_ERROR_MESSAGE}
      </p>
    )
  }
  if (isInflight) {
    return (
      <p role="status" className="mt-1 text-xs text-muted-foreground" data-testid={testId}>
        {WRITEBACK_INFLIGHT_MESSAGE}
      </p>
    )
  }
  return null
}
