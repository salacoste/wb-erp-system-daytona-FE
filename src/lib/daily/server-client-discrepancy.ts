/**
 * @fileoverview Server/client theoretical-profit discrepancy telemetry.
 * Epic 93-FE Story 93.2: discrepancy measurement for observability.
 * Story 100.2-FE: client-side fallback removed; module retained for
 * potential future use if server computation changes.
 *
 * @see Story 93.2-FE
 * @see Story 100.2-FE
 */

export interface Discrepancy {
  date: string
  serverValue: number
  clientValue: number
  absDiff: number
  relDiff: number | null // null when serverValue is 0 (div-by-zero undefined, not 0)
  beyondThreshold: boolean
}

export const DISCREPANCY_THRESHOLDS = {
  absoluteRub: 1, // 1 ₽
  relative: 0.01, // 1%
} as const

/**
 * Pure comparator. No side effects.
 * Both abs AND rel thresholds must exceed for beyondThreshold to fire
 * (cuts noise from either floor alone).
 *
 * @see Story 93.2-FE
 */
export function compareServerClientProfit(
  date: string,
  serverValue: number,
  clientValue: number
): Discrepancy {
  const absDiff = Math.abs(serverValue - clientValue)
  const relDiff = serverValue === 0 ? null : absDiff / Math.abs(serverValue)
  const beyondThreshold =
    absDiff >= DISCREPANCY_THRESHOLDS.absoluteRub &&
    (relDiff === null || relDiff >= DISCREPANCY_THRESHOLDS.relative)
  return { date, serverValue, clientValue, absDiff, relDiff, beyondThreshold }
}

/**
 * Structured logger. No-op when beyondThreshold=false OR when in test env
 * without VITEST_EXPECT_LOG escape hatch.
 * Matches the existing codebase convention (Story 92.5 H-4:
 * MonitorPipelineHealth.tsx:86-108 uses console.warn + stable prefix).
 */
export function logDiscrepancy(d: Discrepancy): void {
  if (!d.beyondThreshold) return
  if (process.env.NODE_ENV === 'test' && !process.env.VITEST_EXPECT_LOG) return
  const relPct = d.relDiff === null ? 'n/a' : `${(d.relDiff * 100).toFixed(2)}%`
  console.warn(
    `[NetProfitDiscrepancy] ${d.date}: server=${d.serverValue.toFixed(2)}, ` +
      `client=${d.clientValue.toFixed(2)}, absDiff=${d.absDiff.toFixed(2)} ₽, relDiff=${relPct}`
  )
}
