/**
 * Tariff Fallback Diagnostics — bounded warning dedup.
 * Story 164.3-FE / FR14: deduplicate storage-tariff fallback warnings.
 *
 * Two noise sources this utility collapses:
 *  1. WITHIN one calculation: N warehouse rows hitting the same fallback
 *     condition each emit a per-row warn → here they collect into ONE
 *     aggregate diagnostic (count + bounded non-sensitive sample).
 *  2. ACROSS repeated renders/calculations: an identical fallback snapshot
 *     re-emits nothing; only a materially changed snapshot re-emits.
 *
 * OPT-IN: only the aggregate supply-lookup caller routes through here. Direct
 * tariff-extraction callers keep their own per-call warn (AC#4) unless they
 * explicitly suppress it via `extractStorageTariffs(..., { warn: false })`.
 *
 * Boundaries / bounds:
 *  - Sample cap: at most MAX_SAMPLE distinct fallback reasons per aggregate.
 *  - Snapshot store cap: at most MAX_SNAPSHOTS signatures retained (FIFO
 *    eviction of the oldest once full) → the store cannot grow unbounded.
 *  - Non-sensitive: snapshot signature is derived ONLY from {count, reasons};
 *    warehouse ids/names are NOT placed in the signature. The bounded sample
 *    passed to the logger is the reason set, not raw tariff data.
 *
 * Deterministic snapshot signature: `count|reason-a,reason-b` (reasons sorted,
 * deduped). Two calls with the same multiset of reasons produce the same
 * signature regardless of row order, so identical noise does not re-emit.
 */

import { logger } from '@/lib/logger'

/** Maximum distinct fallback reasons retained in one aggregate's sample. */
export const MAX_SAMPLE = 5

/** Maximum snapshot signatures retained for cross-call dedup (FIFO eviction). */
export const MAX_SNAPSHOTS = 32

/** A single fallback event recorded during one calculation pass. */
export interface TariffFallbackEvent {
  /** Stable, non-sensitive reason code (e.g. 'empty-response', 'base-zero'). */
  reason: string
}

/** Result of flushing one calculation's collected events. */
export interface TariffFallbackFlushResult {
  /** Whether an aggregate diagnostic was emitted on this flush. */
  emitted: boolean
  /** Number of fallback events collected in this flush (0 if nothing). */
  count: number
  /**
   * Snapshot signature of this flush (count|sorted-reasons). Present even when
   * not emitted, so callers/tests can inspect what would have been logged.
   */
  signature: string
}

function buildSignature(count: number, reasons: string[]): string {
  const uniqueSorted = Array.from(new Set(reasons)).sort().join(',')
  return `${count}|${uniqueSorted}`
}

/**
 * Bounded, testable dedup accumulator for storage-tariff fallback warnings.
 *
 * One instance is meant to be reused across calculations within a scope
 * (module-level singleton for the supply lookup; or per-test instances). Use
 * `reset()` to clear both the in-flight collection and the cross-call store.
 */
export class TariffFallbackDiagnostics {
  private readonly emittedSignatures = new Set<string>()
  private readonly insertionOrder: string[] = []
  private currentCount = 0
  private currentReasons: string[] = []

  /** Record a single fallback event for the in-flight calculation. */
  record(event: TariffFallbackEvent): void {
    this.currentCount++
    if (this.currentReasons.length < MAX_SAMPLE) {
      this.currentReasons.push(event.reason)
    }
  }

  /**
   * Flush the in-flight collection: emit ONE aggregate warn if any events were
   * recorded AND the snapshot signature is materially new. Resets the in-flight
   * collection (but NOT the cross-call signature store) for the next calc.
   */
  flush(): TariffFallbackFlushResult {
    const count = this.currentCount
    const reasons = this.currentReasons
    const signature = buildSignature(count, reasons)

    // Reset in-flight state regardless of emit decision.
    this.currentCount = 0
    this.currentReasons = []

    if (count === 0) {
      return { emitted: false, count: 0, signature }
    }

    if (this.emittedSignatures.has(signature)) {
      return { emitted: false, count, signature }
    }

    // Bounded store: evict oldest insertion once cap is reached (FIFO).
    if (this.insertionOrder.length >= MAX_SNAPSHOTS) {
      const oldest = this.insertionOrder.shift()
      if (oldest !== undefined) {
        this.emittedSignatures.delete(oldest)
      }
    }
    this.emittedSignatures.add(signature)
    this.insertionOrder.push(signature)

    logger.warn(
      `[StorageTariffs] ${count} warehouse(s) using fallback storage tariffs for this calculation`,
      { reasons }
    )

    return { emitted: true, count, signature }
  }

  /** Clear ALL state: in-flight collection AND cross-call signature store. */
  reset(): void {
    this.currentCount = 0
    this.currentReasons = []
    this.emittedSignatures.clear()
    this.insertionOrder.length = 0
  }
}

/** Module-level singleton used by the aggregate supply-tariff lookup path. */
export const storageFallbackDiagnostics = new TariffFallbackDiagnostics()

/** Test-only escape hatch: clear the singleton's dedup state between tests. */
export function resetStorageFallbackDiagnosticsForTests(): void {
  storageFallbackDiagnostics.reset()
}
