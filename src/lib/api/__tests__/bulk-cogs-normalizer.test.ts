/**
 * bulk-cogs normalizer — Validation F-34.
 * Pins: legacy { totalItems, createdItems, skippedItems, errors } AND v2
 * { succeeded, failed, results, message, marginRecalculation } both normalize to the
 * canonical BulkCogsResultSummary; counts coerce to 0; marginRecalculation is v2-only.
 */

import { describe, it, expect } from 'vitest'
import { normalizeBulkCogsResponse } from '../bulk-cogs-normalizer'

describe('normalizeBulkCogsResponse', () => {
  it('maps the LEGACY shape (createdItems→succeeded, skippedItems→failed, errors→results)', () => {
    const res = normalizeBulkCogsResponse({
      totalItems: 3,
      createdItems: 2,
      skippedItems: 1,
      errors: [{ nm_id: '12345', error: 'duplicate valid_from' }],
    })
    expect(res.succeeded).toBe(2)
    expect(res.failed).toBe(1)
    expect(res.results).toHaveLength(1)
    expect(res.results[0]).toMatchObject({
      nm_id: '12345',
      success: false,
      error_message: 'duplicate valid_from',
    })
    expect(res.marginRecalculation).toBeUndefined()
  })

  it('passes through the v2 shape (succeeded/failed/results/message/marginRecalculation)', () => {
    const res = normalizeBulkCogsResponse({
      succeeded: 5,
      failed: 0,
      results: [{ nm_id: '999', success: true, cogs_id: 'c1' }],
      message: 'ok',
      marginRecalculation: { status: 'pending', weeks: ['2026-W22'], taskId: 't1' },
    })
    expect(res.succeeded).toBe(5)
    expect(res.failed).toBe(0)
    expect(res.results[0]).toMatchObject({ nm_id: '999', success: true })
    expect(res.message).toBe('ok')
    expect(res.marginRecalculation).toMatchObject({ status: 'pending', taskId: 't1' })
  })

  it('descends a surviving { data: {...} } wrapper defensively (v2 inside)', () => {
    const res = normalizeBulkCogsResponse({
      data: { succeeded: 4, failed: 1, results: [], message: 'm' },
    })
    expect(res.succeeded).toBe(4)
    expect(res.failed).toBe(1)
  })

  it('descends a surviving { data: {...} } wrapper with the LEGACY shape inside', () => {
    const res = normalizeBulkCogsResponse({
      data: {
        totalItems: 2,
        createdItems: 1,
        skippedItems: 1,
        errors: [{ nm_id: 'x', error: 'e' }],
      },
    })
    expect(res.succeeded).toBe(1)
    expect(res.failed).toBe(1)
    expect(res.results).toHaveLength(1)
  })

  it('coerces missing counts to 0 and returns [] results for empty/null input', () => {
    expect(normalizeBulkCogsResponse(null)).toMatchObject({
      succeeded: 0,
      failed: 0,
      results: [],
      message: '',
    })
    expect(normalizeBulkCogsResponse({})).toMatchObject({ succeeded: 0, failed: 0, results: [] })
    const legacyNoErrors = normalizeBulkCogsResponse({
      totalItems: 1,
      createdItems: 1,
      skippedItems: 0,
    })
    expect(legacyNoErrors.results).toEqual([])
    expect(legacyNoErrors.succeeded).toBe(1)
  })
})
