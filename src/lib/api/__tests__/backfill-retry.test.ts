/**
 * retryBackfill — Story 165.5 per-status retry contract.
 * Verifies: correct URL per dataSource, body `{ cabinetId }`, `{success,message}`
 * normalization, and that 404/409/403 propagate as ApiError (instanceof-safe).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import { retryBackfill, normalizeRetryBackfillResponse } from '../backfill'

describe('retryBackfill — Story 165.5', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs to /v1/admin/backfill/report/retry for dataSource="reports" with { cabinetId }', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Reports backfill retry started (attempt 2)',
    })

    const res = await retryBackfill('cab-uuid-1', 'reports')

    expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/report/retry', {
      cabinetId: 'cab-uuid-1',
    })
    expect(res).toEqual({ success: true, message: 'Reports backfill retry started (attempt 2)' })
  })

  it('POSTs to /v1/admin/backfill/analytics/retry for dataSource="analytics"', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Analytics backfill retry started (attempt 1)',
    })

    await retryBackfill('cab-uuid-2', 'analytics')

    expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/analytics/retry', {
      cabinetId: 'cab-uuid-2',
    })
  })

  it('never makes a combined/cabinet-wide call — reports and analytics hit distinct URLs', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: true, message: 'ok' })

    await retryBackfill('cab-uuid-1', 'reports')
    await retryBackfill('cab-uuid-1', 'analytics')

    const urls = vi.mocked(apiClient.post).mock.calls.map(c => c[0])
    expect(urls).toContain('/v1/admin/backfill/report/retry')
    expect(urls).toContain('/v1/admin/backfill/analytics/retry')
    expect(urls).not.toContain('/v1/admin/backfill/retry')
  })

  it('String()-coerces an opaque numeric cabinetId in the body', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
    await retryBackfill(String(123456), 'reports')
    expect(vi.mocked(apiClient.post).mock.calls[0][1]).toEqual({ cabinetId: '123456' })
  })

  it('propagates 404 BACKFILL_NOT_FAILED as an ApiError (instanceof-safe)', async () => {
    const err = new ApiError('BACKFILL_NOT_FAILED', 404, {})
    vi.mocked(apiClient.post).mockRejectedValueOnce(err)

    await expect(retryBackfill('cab-uuid-1', 'reports')).rejects.toBe(err)
    expect(err).toBeInstanceOf(ApiError)
  })

  it('propagates 409 BACKFILL_IN_PROGRESS as an ApiError', async () => {
    const err = new ApiError('BACKFILL_IN_PROGRESS', 409, {})
    vi.mocked(apiClient.post).mockRejectedValueOnce(err)

    await expect(retryBackfill('cab-uuid-1', 'analytics')).rejects.toMatchObject({
      status: 409,
      message: 'BACKFILL_IN_PROGRESS',
    })
  })

  it('propagates 403 (role/cabinet) as an ApiError', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiError('Forbidden resource', 403, {}))

    await expect(retryBackfill('cab-uuid-1', 'reports')).rejects.toMatchObject({ status: 403 })
  })
})

describe('normalizeRetryBackfillResponse — boundary coercion', () => {
  it('preserves a truthful { success: true, message }', () => {
    expect(
      normalizeRetryBackfillResponse({ success: true, message: 'retry started (attempt 3)' })
    ).toEqual({ success: true, message: 'retry started (attempt 3)' })
  })

  it('defaults success to false when absent (never trust a bare truthy read)', () => {
    expect(normalizeRetryBackfillResponse({ message: 'x' })).toEqual({
      success: false,
      message: 'x',
    })
  })

  it('defaults success to false for a non-boolean truthy value (e.g. "true" string)', () => {
    expect(normalizeRetryBackfillResponse({ success: 'true', message: 'x' })).toEqual({
      success: false,
      message: 'x',
    })
  })

  it('defaults message to "" when absent/non-string', () => {
    expect(normalizeRetryBackfillResponse({ success: true })).toEqual({
      success: true,
      message: '',
    })
    expect(normalizeRetryBackfillResponse({ success: true, message: 42 })).toEqual({
      success: true,
      message: '',
    })
  })

  it('returns a safe empty shape for null/undefined input', () => {
    expect(normalizeRetryBackfillResponse(null)).toEqual({ success: false, message: '' })
    expect(normalizeRetryBackfillResponse(undefined)).toEqual({ success: false, message: '' })
  })
})
