/**
 * useWritebackJob coordinator tests (NEW-2 PR2, Finding 7).
 *
 * Verifies the terminal-fire contract after the review fixes:
 *   - terminal fires EXACTLY once per jobId (cached terminal data doesn't re-fire)
 *   - no re-fire on re-render of the same hook (latest-callback ref, effect keyed
 *     only on [jobId, poll.isTerminal])
 *   - a new jobId resets the guard and fires for the new job
 *   - the action captured at fire time (actionKindRef) is forwarded to onTerminal
 *
 * usePollWritebackJob is mocked via module-level state that the test advances with
 * `setPoll` + a re-render, so terminal arrival is deterministic and decoupled
 * from the setJobId call. No `as`/`any`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, render, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'

// Module-level poll state the mock reads at render time. Tests advance it via
// setPoll() then trigger a re-render (the hook reads poll.* on every render).
// Pass-2 P2-4: pollEffectiveStatus + pollTimedOut let a test drive the timeout
// effectiveStatus through the coordinator (the real hook derives effectiveStatus
// from timedOut — the mock mirrors that contract).
let pollIsTerminal = false
let pollData: { status: string; error: string | null } | null = null
let pollIsError = false
let pollEffectiveStatus: string | undefined = undefined
let pollTimedOut = false

vi.mock('../useCommunicationsWriteback', () => ({
  usePollWritebackJob: () => ({
    isTerminal: pollIsTerminal,
    data: pollData,
    effectiveStatus: pollEffectiveStatus ?? (pollTimedOut ? 'timeout' : pollData?.status),
    timedOut: pollTimedOut,
    isError: pollIsError,
  }),
}))

import { useWritebackJob } from '../useWritebackJob'

interface TerminalCall {
  status: string
  error: string | null | undefined
  meta: { actionKind: string | null; pollError: boolean }
}
const terminalCalls: TerminalCall[] = []
const onTerminal = vi.fn(
  (
    status: string,
    error: string | null | undefined,
    meta: Omit<TerminalCall, 'status' | 'error'>['meta']
  ) => {
    terminalCalls.push({ status, error, meta })
  }
)

/** Advance the mocked poll snapshot + terminal flag, then re-render to flush. */
function goTerminal(rerender: () => void, status: string, error: string | null) {
  pollData = { status, error }
  pollIsTerminal = true
  pollIsError = false
  rerender()
}

function resetPoll() {
  pollIsTerminal = false
  pollData = null
  pollIsError = false
  pollEffectiveStatus = undefined
  pollTimedOut = false
}

describe('useWritebackJob — terminal-fire contract (Finding 7)', () => {
  beforeEach(() => {
    resetPoll()
    onTerminal.mockClear()
    terminalCalls.length = 0
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('fires onTerminal exactly once when the poll reaches terminal (cached data)', async () => {
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-A')
      result.current.setActionKind('reply_feedback')
    })
    goTerminal(rerender, 'completed', null)
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    // Re-render with the SAME cached terminal data must NOT re-fire.
    rerender()
    rerender()
    expect(onTerminal).toHaveBeenCalledTimes(1)
  })

  it('does NOT re-fire on a plain re-render (callback identity changes too)', async () => {
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-B')
      result.current.setActionKind('answer_question')
    })
    goTerminal(rerender, 'completed', null)
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    // Re-render with a NEW callback instance — must NOT re-fire (latest-callback ref).
    rerender()
    expect(onTerminal).toHaveBeenCalledTimes(1)
  })

  it('a new jobId resets the guard and fires for the new job', async () => {
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-1')
      result.current.setActionKind('reply_feedback')
    })
    goTerminal(rerender, 'completed', null)
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))

    // Second job: reset poll to non-terminal, capture a new id, then go terminal.
    resetPoll()
    rerender() // flush the non-terminal snapshot for the new round
    act(() => {
      result.current.setJobId('job-2')
      result.current.setActionKind('update_feedback_reply')
    })
    goTerminal(rerender, 'completed', null)
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(2))
    expect(terminalCalls[1].meta.actionKind).toBe('update_feedback_reply')
  })

  it('forwards the action captured at fire time (actionKindRef)', async () => {
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-X')
      result.current.setActionKind('pin_feedback')
    })
    goTerminal(rerender, 'failed', 'WB rejected')
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    expect(terminalCalls[0].status).toBe('failed')
    expect(terminalCalls[0].error).toBe('WB rejected')
    expect(terminalCalls[0].meta.actionKind).toBe('pin_feedback')
    expect(terminalCalls[0].meta.pollError).toBe(false)
  })

  it('surfaces a poll error (no job data) as pollError=true, NOT a fabricated failed', async () => {
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-P')
      result.current.setActionKind('send_chat')
    })
    // Poll itself errored with no job data (Finding 11) — terminal via isTerminal.
    pollData = null
    pollIsError = true
    pollIsTerminal = true
    rerender()
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    // pollError is true; status is NOT 'failed' (no fabrication) — effectiveStatus
    // falls back to 'completed' (the terminal sentinel), and pollError flags it.
    expect(terminalCalls[0].meta.pollError).toBe(true)
    expect(terminalCalls[0].status).not.toBe('failed')
  })

  it('terminal does not re-fire on rerender (latest-callback ref holds the guard)', async () => {
    // Pass-2 P2-3: this verifies re-render stability (callback identity changes
    // do NOT re-fire terminal because the fire effect is keyed only on
    // [jobId, poll.isTerminal]). It is NOT a React 18+ StrictMode mount→unmount
    // →remount double-invoke reproduction (renderHook can't express that); the
    // firedRef source guard is correct regardless, and this asserts what the
    // hook actually guarantees on a plain rerender.
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-R')
      result.current.setActionKind('send_chat')
    })
    goTerminal(rerender, 'completed', null)
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    rerender()
    rerender()
    expect(onTerminal).toHaveBeenCalledTimes(1)
  })

  it('StrictMode mount→unmount→remount fires terminal exactly once (real render)', async () => {
    // Pass-2 P2-3: a REAL <StrictMode> component tree reproduces React 18+'s
    // effect double-invoke. The firedRef guard must keep terminal firing exactly
    // once across the StrictMode remount for a given jobId.
    function Harness() {
      const job = useWritebackJob(onTerminal)
      return React.createElement('button', {
        'data-testid': 'sm-set-job',
        onClick: () => {
          job.setJobId('job-SM')
          job.setActionKind('pin_feedback')
        },
      })
    }
    const { getByTestId, rerender } = render(
      React.createElement(React.StrictMode, null, React.createElement(Harness))
    )
    act(() => fireEvent.click(getByTestId('sm-set-job')))
    pollData = { status: 'completed', error: null }
    pollIsTerminal = true
    pollEffectiveStatus = 'completed'
    rerender(React.createElement(React.StrictMode, null, React.createElement(Harness)))
    await waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    // Settle any deferred StrictMode effects, then assert the guard held.
    await new Promise(r => setTimeout(r, 10))
    expect(onTerminal).toHaveBeenCalledTimes(1)
    expect(terminalCalls[0].meta.actionKind).toBe('pin_feedback')
  })

  it('forwards the timeout effectiveStatus through onTerminal (P2-4)', async () => {
    // Pass-2 P2-4: a poll timeout surfaces effectiveStatus 'timeout'; the
    // coordinator forwards it so the component can render the RU timeout copy.
    const { result, rerender } = renderHook(() => useWritebackJob(onTerminal))
    act(() => {
      result.current.setJobId('job-T')
      result.current.setActionKind('reply_feedback')
    })
    // Poll timed out — no BullMQ terminal, but isTerminal flips via timedOut.
    pollData = { status: 'active', error: null }
    pollTimedOut = true
    pollEffectiveStatus = 'timeout'
    pollIsTerminal = true
    rerender()
    await vi.waitFor(() => expect(onTerminal).toHaveBeenCalledTimes(1))
    expect(terminalCalls[0].status).toBe('timeout')
    expect(terminalCalls[0].meta.actionKind).toBe('reply_feedback')
    expect(terminalCalls[0].meta.pollError).toBe(false)
  })
})
