/**
 * Dev-only logger — silent in production, verbose in development.
 *
 * Replaces raw `console.info` / `console.log` in the API layer.
 * Production builds tree-shake the no-op branches away.
 */

const isDev = process.env.NODE_ENV === 'development'

/** Debug-level log — API request/response tracing. No-op in production. */
export function debug(...args: unknown[]): void {
  if (isDev) console.info('[debug]', ...args)
}

/** Info-level log — noteworthy events. No-op in production. */
export function info(...args: unknown[]): void {
  if (isDev) console.info('[info]', ...args)
}

/** Warn-level log — always visible. */
export function warn(...args: unknown[]): void {
  console.warn('[warn]', ...args)
}

/** Named export for import as object: `import { logger } from '@/lib/logger'` */
export const logger = { debug, info, warn }
