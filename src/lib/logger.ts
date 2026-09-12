/**
 * Dev-only logger — silent in production, verbose in development.
 *
 * Replaces raw `console.info` / `console.log` in the API layer.
 * Production builds tree-shake the no-op branches away.
 */

import { redactSensitive } from './redact-utils'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Central redaction for always-visible log levels (warn/error) — debt registry
 * residual: 131 logger.warn/error call sites bypass the logApiError redaction
 * path, so the redactor is applied here instead of at each site.
 *
 * Error instances are cloned same-class (Object.create keeps the prototype, so
 * `instanceof ApiError` and `name` survive) with prototype/message/stack
 * preserved: message and every enumerable own prop (ApiError carries the raw
 * response body as `data`, api-client.ts constructor param prop) are passed
 * through redactSensitive; identity is intentionally lost — irrelevant for a
 * console sink.
 *
 * Non-Error non-plain objects (Date/Map/Set/class instances without enumerable
 * own props) collapse to {} per redactSensitive's JSON-only contract — pass
 * primitives, plain objects, or Errors. redactSensitive is idempotent, so the
 * logApiError path (which already redacts before calling logger.error) is safe
 * under double application.
 */
function redactArg(arg: unknown): unknown {
  if (!(arg instanceof Error)) return redactSensitive(arg)
  const clone = Object.create(Object.getPrototypeOf(arg)) as Error & Record<string, unknown>
  const clonedMessage = redactSensitive(arg.message)
  if (typeof clonedMessage === 'string') clone.message = clonedMessage
  clone.stack = arg.stack
  for (const [key, val] of Object.entries(arg)) {
    clone[key] = key === 'stack' ? arg.stack : redactSensitive(val)
  }
  return clone
}

/** Debug-level log — API request/response tracing. No-op in production. */
export function debug(...args: unknown[]): void {
  if (isDev) console.info('[debug]', ...args)
}

/** Info-level log — noteworthy events. No-op in production. */
export function info(...args: unknown[]): void {
  if (isDev) console.info('[info]', ...args)
}

/** Warn-level log — always visible. Args pass through the FE-D9 redactor. */
export function warn(...args: unknown[]): void {
  console.warn('[warn]', ...args.map(redactArg))
}

/** Error-level log — always visible. Args pass through the FE-D9 redactor. */
export function error(...args: unknown[]): void {
  console.error('[error]', ...args.map(redactArg))
}

/** Named export for import as object: `import { logger } from '@/lib/logger'` */
export const logger = { debug, info, warn, error }
