/**
 * Storage Import Normalizer Tests
 * Covers: normalizeImportStatusResponse
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeImportStatusResponse } from '../storage-import-normalizer'
import { logger } from '@/lib/logger'

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

describe('normalizeImportStatusResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path: normalizes completed import status', () => {
    const raw = {
      import_id: 'abc-123',
      status: 'completed',
      rows_imported: 150,
      completed_at: '2025-01-01T12:00:00Z',
      date_range: { start: '2025-01-01', end: '2025-01-07' },
    }
    const result = normalizeImportStatusResponse(raw)
    expect(result.import_id).toBe('abc-123')
    expect(result.status).toBe('completed')
    expect(result.rows_imported).toBe(150)
    expect(result.completed_at).toBe('2025-01-01T12:00:00Z')
    expect(result.date_range).toEqual({ start: '2025-01-01', end: '2025-01-07' })
  })

  it('normalizes the authoritative nested failure contract without losing compatibility detail', () => {
    const raw = {
      import_id: 'xyz-456',
      status: 'failed',
      error: {
        code: 'JOB_FAILED',
        message: 'Connection timeout',
        details: { retryAfterSeconds: 30 },
      },
      completed_at: '2025-01-01T12:05:00Z',
    }
    const result = normalizeImportStatusResponse(raw)
    expect(result.status).toBe('failed')
    expect(result.error_message).toBe('Connection timeout')
    expect(result.error).toEqual(raw.error)
  })

  // Story 169.12 Task 0 (Defensive Frontend): pins flipped from 'failed' to
  // 'unknown' — an absent/unrecognized status is UNKNOWN, not a failure; the old
  // coercion rendered a false import error.
  it('null input preserves unknown status with empty id', () => {
    const result = normalizeImportStatusResponse(null)
    expect(result.import_id).toBe('')
    expect(result.status).toBe('unknown')
    expect(result.rows_imported).toBeUndefined()
    expect(result.error_message).toBeUndefined()
    expect(result.completed_at).toBeUndefined()
    expect(logger.warn).toHaveBeenCalledWith(
      '[Storage Import] Unrecognized import status received',
      { status: '<missing>' }
    )
  })

  it('missing fields default safely to unknown status', () => {
    const result = normalizeImportStatusResponse({})
    expect(result.import_id).toBe('')
    expect(result.status).toBe('unknown')
    expect(logger.warn).toHaveBeenCalledWith(
      '[Storage Import] Unrecognized import status received',
      { status: '<missing>' }
    )
  })

  it('unrecognized status string is preserved distinguishably as unknown (not failed)', () => {
    const result = normalizeImportStatusResponse({ import_id: 'x', status: 'partially_stuck' })
    expect(result.status).toBe('unknown')
    expect(logger.warn).toHaveBeenCalledWith(
      '[Storage Import] Unrecognized import status received',
      { status: '<unrecognized>' }
    )
  })

  it.each(['constructor', 'toString', '__proto__'])(
    'treats inherited object key %s as an unrecognized lifecycle value',
    status => {
      const result = normalizeImportStatusResponse({ import_id: 'x', status })
      expect(result.status).toBe('unknown')
      expect(logger.warn).toHaveBeenCalledWith(
        '[Storage Import] Unrecognized import status received',
        { status: '<unrecognized>' }
      )
    }
  )

  it('does not echo untrusted lifecycle text into diagnostics', () => {
    const status = 'Bearer synthetic-secret\nsecond-line'.repeat(100)
    const result = normalizeImportStatusResponse({ import_id: 'x', status })

    expect(result.status).toBe('unknown')
    expect(logger.warn).toHaveBeenCalledWith(
      '[Storage Import] Unrecognized import status received',
      { status: '<unrecognized>' }
    )
  })

  it('valid statuses pass through unchanged (regression pins)', () => {
    for (const status of ['pending', 'processing', 'completed', 'failed']) {
      expect(normalizeImportStatusResponse({ import_id: 'x', status }).status).toBe(status)
    }
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it.each(['pending', 'processing', 'failed'])(
    'does not expose row counts for %s lifecycle data',
    status => {
      const result = normalizeImportStatusResponse({
        import_id: 'x',
        status,
        rows_imported: 50,
      })
      expect(result.rows_imported).toBeUndefined()
    }
  )

  it('preserves an authoritative completed rows_imported value of zero', () => {
    const result = normalizeImportStatusResponse({
      import_id: 'x',
      status: 'completed',
      rows_imported: 0,
    })
    expect(result.rows_imported).toBe(0)
  })

  it('does not expose an unsafe completed rows_imported integer', () => {
    const result = normalizeImportStatusResponse({
      import_id: 'x',
      status: 'completed',
      rows_imported: Number.MAX_SAFE_INTEGER + 1,
    })
    expect(result.rows_imported).toBeUndefined()
  })
})
