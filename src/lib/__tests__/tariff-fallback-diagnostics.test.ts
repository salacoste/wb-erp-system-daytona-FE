/**
 * Unit tests for tariff-fallback-diagnostics.ts
 * Story 164.3-FE / FR14: bounded storage-tariff fallback warning dedup.
 *
 * Locks (AC#5):
 *  (a) one calc with N rows same fallback -> exactly ONE aggregate warn (not N)
 *  (b) repeated identical-snapshot calls -> no re-emit
 *  (c) materially changed snapshot -> new emit
 *  (d) reset() clears state
 *  (e) direct (non-aggregate) caller still warns directly
 *      (covered in tariff-extraction-utils.test.ts; asserted here at the
 *       boundary by verifying flush() is the only emit path the diag owns)
 *  (f) bounds: sample cap (MAX_SAMPLE) + snapshot store cap (MAX_SNAPSHOTS)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '@/lib/logger'
import {
  TariffFallbackDiagnostics,
  MAX_SAMPLE,
  MAX_SNAPSHOTS,
} from '../tariff-fallback-diagnostics'

describe('TariffFallbackDiagnostics', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  describe('within-calc aggregation (AC#2)', () => {
    it('(a) emits exactly ONE aggregate warn when N rows hit the same fallback', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.record({ reason: 'base-zero' })
      diag.record({ reason: 'base-zero' })
      const result = diag.flush()

      expect(result.emitted).toBe(true)
      expect(result.count).toBe(3)
      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith(
        '[StorageTariffs] 3 warehouse(s) using fallback storage tariffs for this calculation',
        { reasons: ['base-zero', 'base-zero', 'base-zero'] }
      )
    })

    it('emits nothing when zero events were recorded', () => {
      const diag = new TariffFallbackDiagnostics()
      const result = diag.flush()

      expect(result.emitted).toBe(false)
      expect(result.count).toBe(0)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('flush() resets the in-flight collection for the next calc', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.flush()
      ;(logger.warn as ReturnType<typeof vi.fn>).mockClear()

      // Second flush with no new events emits nothing.
      const result = diag.flush()
      expect(result.emitted).toBe(false)
      expect(result.count).toBe(0)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('records distinct reason codes in the bounded sample', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'empty-response' })
      diag.record({ reason: 'base-zero' })
      const result = diag.flush()

      expect(result.emitted).toBe(true)
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
        reasons: ['empty-response', 'base-zero'],
      })
    })
  })

  describe('cross-call dedup (AC#3)', () => {
    it('(b) repeated identical-snapshot calls do NOT re-emit', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      const first = diag.flush()
      diag.record({ reason: 'base-zero' })
      const second = diag.flush()

      expect(first.emitted).toBe(true)
      expect(second.emitted).toBe(false) // identical snapshot -> deduped
      expect(logger.warn).toHaveBeenCalledTimes(1)
    })

    it('(c) a materially changed snapshot re-emits', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.flush()
      // Count changes 1 -> 2: materially new snapshot signature.
      diag.record({ reason: 'base-zero' })
      diag.record({ reason: 'base-zero' })
      const result = diag.flush()

      expect(result.emitted).toBe(true)
      expect(logger.warn).toHaveBeenCalledTimes(2)
    })

    it('signature is order-independent (same multiset of reasons dedupes)', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.record({ reason: 'empty-response' })
      diag.flush()
      // Same multiset, different order -> same sorted signature -> deduped.
      diag.record({ reason: 'empty-response' })
      diag.record({ reason: 'base-zero' })
      const result = diag.flush()

      expect(result.emitted).toBe(false)
    })

    it('a count-only change with the same reason set still counts as material', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      const r1 = diag.flush()
      diag.record({ reason: 'base-zero' })
      diag.record({ reason: 'base-zero' })
      const r2 = diag.flush()

      expect(r1.signature).toBe('1|base-zero')
      expect(r2.signature).toBe('2|base-zero')
      expect(r1.emitted).toBe(true)
      expect(r2.emitted).toBe(true)
    })
  })

  describe('reset() (AC#5d)', () => {
    it('(d) reset() clears cross-call dedup state so the next flush re-emits', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.flush()
      diag.reset()
      diag.record({ reason: 'base-zero' })
      const result = diag.flush()

      expect(result.emitted).toBe(true)
      expect(logger.warn).toHaveBeenCalledTimes(2)
    })

    it('reset() clears in-flight events', () => {
      const diag = new TariffFallbackDiagnostics()
      diag.record({ reason: 'base-zero' })
      diag.reset()
      const result = diag.flush()

      expect(result.emitted).toBe(false)
      expect(result.count).toBe(0)
    })
  })

  describe('bounds (AC#5f)', () => {
    it('caps the per-calc sample at MAX_SAMPLE reasons', () => {
      const diag = new TariffFallbackDiagnostics()
      // Record more distinct reasons than the cap; only the first MAX_SAMPLE
      // are retained in the bounded sample (count still reflects all events).
      for (let i = 0; i < MAX_SAMPLE + 3; i++) {
        diag.record({ reason: `reason-${i}` })
      }
      const result = diag.flush()

      const emittedArgs = (logger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
        reasons: string[]
      }
      expect(result.count).toBe(MAX_SAMPLE + 3)
      expect(emittedArgs.reasons).toHaveLength(MAX_SAMPLE)
    })

    it('caps the cross-call snapshot store at MAX_SNAPSHOTS (FIFO eviction of the oldest; middle stays deduped)', () => {
      const diag = new TariffFallbackDiagnostics()
      // Each iteration i produces a materially distinct snapshot signature:
      //   i+1 events with reasons reason-0..reason-i  ->  signature `${i+1}|reason-0,...,reason-i`
      // So iter-0 = "1|reason-0" (OLDEST), iter-1 = "2|reason-0,reason-1", ...
      for (let i = 0; i < MAX_SNAPSHOTS + 5; i++) {
        for (let j = 0; j <= i; j++) {
          diag.record({ reason: `reason-${j}` })
        }
        const result = diag.flush()
        // Every snapshot was distinct -> every flush emitted.
        expect(result.emitted).toBe(true)
      }

      // Bound: store never exceeds MAX_SNAPSHOTS despite MAX_SNAPSHOTS+5 distinct
      // signatures being recorded. (Falsifiable: would fail with > if the
      // eviction block were removed.)
      expect(diag.size()).toBe(MAX_SNAPSHOTS)

      // OLDEST signature (iter-0: a single `reason-0` event) was FIFO-evicted
      // when the store filled, so re-recording it now is EMITTABLE again.
      // (Falsifiable: if the eviction block at flush() were removed, this
      // signature would still be in the store -> emitted:false.)
      diag.record({ reason: 'reason-0' })
      const oldestReplay = diag.flush()
      expect(oldestReplay.emitted).toBe(true)
      expect(oldestReplay.signature).toBe('1|reason-0')

      // A signature from the MIDDLE of the still-retained window (the LAST
      // iter, MAX_SNAPSHOTS+4: MAX_SNAPSHOTS+5 events) is still deduped -> NOT
      // re-emittable. (Falsifiable: if dedup were broken this would emit:true.)
      // Note: the sample is capped at MAX_SAMPLE reasons, so the signature's
      // reason list is only the first MAX_SAMPLE reasons even though count
      // reflects all MAX_SNAPSHOTS+5 events.
      for (let j = 0; j <= MAX_SNAPSHOTS + 4; j++) {
        diag.record({ reason: `reason-${j}` })
      }
      const middleReplay = diag.flush()
      expect(middleReplay.emitted).toBe(false)
      expect(middleReplay.count).toBe(MAX_SNAPSHOTS + 5)
    })
  })
})
