/**
 * NEW-2 — write-back UX helpers + status predicates shared by the four write
 * surfaces (PR2).
 *
 * SINGLE SOURCE OF TRUTH for BullMQ status predicates (Finding 13): this module
 * owns all status-classification logic (polling / completed / terminal). The
 * types file (src/types/communications/writeback.ts) re-exports these so the
 * wire-shape types stay free of behavior.
 *
 * Two cross-cutting concerns:
 *   1. Kill-switch: a 403 from the 4-factor gate means write-back is disabled /
 *      not armed — surface a clear RU message, NOT a generic crash.
 *   2. Async UX copy for the 202→poll→terminal flow ("Отправляется…" / success /
 *      failure copy), kept RU-only per locale policy.
 *
 * ApiError is the project's canonical error type (src/types/api.ts). We import
 * the real class so `instanceof` checks match a real thrown error (AP#3 — never
 * fake ApiError). No `as`/`any`.
 */

import { ApiError } from '@/types/api'

/** RU message shown when the write-back gate returns 403 (disabled / not armed). */
export const WRITEBACK_DISABLED_MESSAGE =
  'Ответы отключены — включите write-back в настройках сервера'

/** RU generic error (network / 5xx) shown when a write fails for non-403 reasons. */
export const WRITEBACK_GENERIC_ERROR_MESSAGE = 'Не удалось отправить. Попробуйте ещё раз'

/** RU in-flight copy while the 202 job is polling toward a terminal state. */
export const WRITEBACK_INFLIGHT_MESSAGE = 'Отправляется…'

/**
 * POLLING ALLOWLIST (Finding 2 — inverted-terminal fix). Polling continues ONLY
 * for these BullMQ non-terminal states. EVERYTHING else — including `completed`,
 * `failed`, AND unknown/unrecognized states — is treated as terminal so a weird
 * state can never spin the poll forever (Defensive Frontend). This is an
 * allowlist (not a blocklist) precisely so an unknown state stops the poll.
 */
export const POLLING_WRITEBACK_STATES = new Set([
  'active',
  'waiting',
  'delayed',
  'waiting-children',
])

/** Terminal completed set (user-facing success). */
export const COMPLETED_WRITEBACK_STATES = new Set(['completed'])

/**
 * True when the BullMQ state is one we should KEEP polling (not yet terminal).
 * Allowlist semantics: only the four non-terminal states above return true;
 * unknown states return false (→ terminal), so the poll never spins forever.
 */
export function isWritebackPolling(status: string | undefined | null): boolean {
  if (!status) return false
  return POLLING_WRITEBACK_STATES.has(status)
}

/** True when a BullMQ job-status string is a user-facing success. */
export function isWritebackCompleted(status: string | undefined | null): boolean {
  return COMPLETED_WRITEBACK_STATES.has(status ?? '')
}

/**
 * True when an error is the EXPECTED 403 kill-switch state (write-back disabled
 * / not armed / missing token). Defensive Frontend: 403 is a permission/config
 * state, not a load failure — render a clear RU indicator and suppress retry.
 */
export function isWritebackDisabledError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

/**
 * Map a write error to the RU user-facing message. 403 → kill-switch copy;
 * anything else → the generic retry copy. Components render this verbatim (the
 * raw BE/English error.message is NEVER shown to the user — locale policy).
 */
export function writebackErrorMessage(error: unknown): string {
  return isWritebackDisabledError(error)
    ? WRITEBACK_DISABLED_MESSAGE
    : WRITEBACK_GENERIC_ERROR_MESSAGE
}
