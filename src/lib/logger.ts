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
 * Error instances pass through intact: redactSensitive's JSON-only contract
 * collapses non-plain objects to {} (message/stack are non-enumerable), which
 * would gut always-visible diagnostics. Strings and plain objects — including
 * body echoes — are redacted; redactSensitive is idempotent, so the logApiError
 * path (which already redacts before calling logger.error) is safe under
 * double application.
 */
function redactArg(arg: unknown): unknown {
  return arg instanceof Error ? arg : redactSensitive(arg)
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
