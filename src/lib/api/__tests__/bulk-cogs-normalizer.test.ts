/**
 * bulk-cogs normalizer — Validation F-34.
 * Pins: legacy { totalItems, createdItems, skippedItems, errors } AND v2
 * { succeeded, failed, results, message, marginRecalculation } both normalize to the
 * canonical BulkCogsResultSummary; counts coerce to 0; marginRecalculation is v2-only.
 */

import { describe, it, expect } from 'vitest'
import { normalizeBulkCogsResponse } from '../bulk-cogs-normalizer'

describe('normalizeBulkCogsResponse', () => {
  // iter-69: pin the REAL live backend error-item shape `{ index, nmId, code, message }` (camelCase,
  // per cogs.service.ts). The old normalizer + fixture used `{ nm_id, error }` which the backend
  // never sends → failed-item rows rendered blank nmId + empty message. Now the camelCase fields map.
  it('maps the LEGACY shape with the real backend error items { index, nmId, code, message }', () => {
    const res = normalizeBulkCogsResponse({
      totalItems: 3,
      createdItems: 2,
      skippedItems: 0, // backend never increments skippedItems — failed derives from errors[]
      errors: [{ index: 0, nmId: '12345', code: 'CREATE_ERROR', message: 'duplicate valid_from' }],
    })
    expect(res.succeeded).toBe(2)
    expect(res.failed).toBe(1) // errors.length (was always 0 from skippedItems → gated rows shut)
    expect(res.results).toHaveLength(1)
    expect(res.results[0]).toMatchObject({
      nm_id: '12345', // was '' (read e.nm_id; backend sends nmId)
      success: false,
      error_code: 'CREATE_ERROR',
      error_message: 'duplicate valid_from', // was undefined (read e.error; backend sends message)
    })
    expect(res.marginRecalculation).toBeUndefined()
  })

  // iter-69: `failed` MUST count the errors[] (skippedItems is always 0 from the backend). With >1
  // error, `failed` must equal errors.length so the dialog's failed table + retry button appear.
  it('derives `failed` from errors.length (multiple failures), not skippedItems', () => {
    const res = normalizeBulkCogsResponse({
      totalItems: 3,
      createdItems: 1,
      skippedItems: 0,
      errors: [
        { index: 1, nmId: '111', code: 'CREATE_ERROR', message: 'e1' },
        { index: 2, nmId: '222', code: 'CREATE_ERROR', message: 'e2' },
      ],
    })
    expect(res.failed).toBe(2) // was 0 (skippedItems) → dialog never showed the 2 failed rows
    expect(res.results).toHaveLength(2)
  })

  it('also accepts legacy snake_case error items { nm_id, error } (backward-compat fallback)', () => {
    const res = normalizeBulkCogsResponse({
      createdItems: 0,
      skippedItems: 0,
      errors: [{ nm_id: '999', error: 'not found' }],
    })
    expect(res.results[0]).toMatchObject({ nm_id: '999', error_message: 'not found' })
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
        skippedItems: 0,
        errors: [{ nm_id: 'x', error: 'e' }],
      },
    })
    expect(res.succeeded).toBe(1)
    expect(res.failed).toBe(1) // errors.length
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
