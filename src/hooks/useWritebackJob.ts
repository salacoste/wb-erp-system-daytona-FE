/**
 * NEW-2 — write-back job coordinator (PR2).
 *
 * Wraps the mutation→202→poll→terminal flow shared by all four write surfaces.
 * The component calls `submit(payload)`; on 202 the coordinator captures the
 * `jobId`, polls `usePollWritebackJob`, and on a terminal state fires
 * `onTerminal(effectiveStatus, error, meta)` exactly once.
 *
 * Finding 4 fixes (stale-closure / double-fire / action-kind drift):
 *   - `onTerminal` is held in a ref refreshed EVERY render, and the fire-effect
 *     is keyed ONLY on [jobId, poll.isTerminal] (never the callback). This kills
 *     the re-fire-on-callback-change path and the StrictMode double-fire.
 *   - `firedRef` resets ONLY on jobId change (the old reset-on-non-terminal
 *     effect could race-clear the guard mid-transition).
 *   - The action kind is captured AT FIRE TIME into `actionKindRef` (set by the
 *     component immediately before calling the mutation) so the toast labels the
 *     action that actually fired, not the current dialog/mode state at terminal.
 *
 * Finding 11 (poll-error vs job-failed): only `effectiveStatus === 'failed'` is
 * surfaced as a job failure. A POLL error (poll.isError with no poll.data) is
 * surfaced as a distinct `pollError` indication — Defensive Frontend: indicate,
 * never fabricate a 'failed' job that BullMQ never reported.
 *
 * The component owns the UX (toast + invalidation); this hook owns the wiring.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePollWritebackJob } from './useCommunicationsWriteback'

/** Context passed to onTerminal so the component can label/branch the toast. */
export interface WritebackTerminalMeta {
  /** The action captured at fire time (null when no action recorded). */
  actionKind: string | null
  /** True when the poll itself errored (no job data) — NOT a job failure. */
  pollError: boolean
}

/** The coordinator's external state (jobId + poll snapshot + terminal flag). */
export interface WritebackJobState {
  /** The jobId captured from the 202 response (null before the first submit). */
  jobId: string | null
  /** The latest polled job status (BullMQ state string). */
  status: string | undefined
  /**
   * The status components should act on: the BullMQ state, or 'timeout' when the
   * poll exceeded MAX_POLL_MS. Forwarded to WritebackStatus so it can render the
   * RU timeout copy (Pass-2 P2-1) distinct from a generic failure.
   */
  effectiveStatus: string | undefined
  /** The job's error string (failedReason — present only when failed). */
  error: string | null | undefined
  /** True once the job reaches a terminal state (completed/failed/timeout). */
  isTerminal: boolean
  /** True when the POLL itself errored (no job data) — distinct from job-failed. */
  pollError: boolean
}

/** Capture a freshly-enqueued jobId and expose the poll coordinator. */
export function useWritebackJob(
  onTerminal?: (
    effectiveStatus: string,
    error: string | null | undefined,
    meta: WritebackTerminalMeta
  ) => void
): WritebackJobState & {
  setJobId: (jobId: string | null) => void
  /** Record the action kind AT FIRE TIME (call immediately before the mutation). */
  setActionKind: (actionKind: string | null) => void
} {
  const [jobId, setJobId] = useState<string | null>(null)
  const poll = usePollWritebackJob(jobId)

  // Latest-callback ref: refreshed every render, read only inside the fire
  // effect (keyed on [jobId, poll.isTerminal]). Prevents stale-closure and
  // stops the callback identity from re-triggering the fire effect.
  const onTerminalRef = useRef(onTerminal)
  useEffect(() => {
    onTerminalRef.current = onTerminal
  })

  // firedRef holds the jobId we've ALREADY fired onTerminal for; reset ONLY on a
  // jobId change (not on non-terminal snapshots — that race-cleared the guard).
  const firedRef = useRef<string | null>(null)
  useEffect(() => {
    if (jobId !== firedRef.current) firedRef.current = null
  }, [jobId])

  // actionKindRef: captured at fire time so the toast labels the action that
  // actually fired, not the current dialog/mode state when terminal arrives.
  const actionKindRef = useRef<string | null>(null)
  const setActionKind = useRef((actionKind: string | null) => {
    actionKindRef.current = actionKind
  }).current

  // Fire onTerminal ONCE per jobId on the terminal transition. Keyed ONLY on
  // [jobId, poll.isTerminal] — not on the callback or data (avoids re-fire on
  // cached-terminal re-renders and StrictMode double-invoke).
  useEffect(() => {
    if (!jobId || !poll.isTerminal) return
    if (firedRef.current === jobId) return
    firedRef.current = jobId
    const jobFailed = poll.data?.status === 'failed'
    const effectiveStatus = jobFailed ? 'failed' : (poll.effectiveStatus ?? 'completed')
    // Finding 11: a poll error (no job data) is NOT a fabricated 'failed' job —
    // surface it as a pollError indication; the component renders it distinctly.
    const pollError = !!poll.isError && !poll.data
    onTerminalRef.current?.(effectiveStatus, poll.data?.error, {
      actionKind: actionKindRef.current,
      pollError,
    })
  }, [jobId, poll.isTerminal, poll.data, poll.effectiveStatus, poll.isError])

  return {
    jobId,
    status: poll.data?.status,
    effectiveStatus: poll.effectiveStatus,
    error: poll.data?.error,
    isTerminal: poll.isTerminal,
    pollError: !!poll.isError && !poll.data,
    setJobId,
    setActionKind,
  }
}
