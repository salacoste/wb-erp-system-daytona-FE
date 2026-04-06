/**
 * Tests for imports-reconcile API
 * POST /v1/imports/historical/:batchId/reconcile
 * Story 84.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { reconcileBatch } from '../imports-reconcile'

describe('reconcileBatch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls POST /v1/imports/historical/:id/reconcile', async () => {
    const mock = { reconciled: true, newStatus: 'completed', weeksWithData: 1 }
    vi.mocked(apiClient.post).mockResolvedValueOnce(mock)

    const result = await reconcileBatch('batch-123')

    expect(apiClient.post).toHaveBeenCalledWith('/v1/imports/historical/batch-123/reconcile')
    expect(result.reconciled).toBe(true)
    expect(result.newStatus).toBe('completed')
  })

  it('returns reconciled: false when data missing', async () => {
    const mock = { reconciled: false, newStatus: 'failed', weeksWithData: 0 }
    vi.mocked(apiClient.post).mockResolvedValueOnce(mock)

    const result = await reconcileBatch('batch-456')
    expect(result.reconciled).toBe(false)
  })

  it('propagates errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Not Found'))
    await expect(reconcileBatch('bad-id')).rejects.toThrow('Not Found')
  })
})
