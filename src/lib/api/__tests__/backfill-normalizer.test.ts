/**
 * getBackfillStatus normalizer — Validation F-29.
 * The backend tracks reports + analytics backfill separately (reportsStatus,
 * analyticsStatus). The normalizer previously mapped only reportsStatus → status
 * and dropped analyticsStatus; this pins that BOTH are now surfaced.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { getBackfillStatus } from '../backfill'

describe('getBackfillStatus — F-29 analytics_status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps reportsStatus → status AND analyticsStatus → analytics_status (separately)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        cabinetId: 'c1',
        cabinetName: 'Cab',
        reportsStatus: 'completed',
        analyticsStatus: 'in_progress',
        overallProgress: 50,
      },
    ] as unknown as Record<string, unknown>[])

    const res = await getBackfillStatus()
    expect(res[0].status).toBe('completed')
    expect(res[0].analytics_status).toBe('in_progress')
  })

  it('defaults analytics_status to "not_started" when the backend omits it', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { cabinetId: 'c1', cabinetName: 'Cab', reportsStatus: 'not_started', overallProgress: 0 },
    ] as unknown as Record<string, unknown>[])

    const res = await getBackfillStatus()
    expect(res[0].analytics_status).toBe('not_started')
    expect(res[0].status).toBe('not_started')
  })

  it('reads the snake_case analytics_status key too (dual-lookup)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { cabinet_id: 'c1', cabinet_name: 'Cab', status: 'idle', analytics_status: 'failed' },
    ] as unknown as Record<string, unknown>[])

    const res = await getBackfillStatus()
    expect(res[0].analytics_status).toBe('failed')
  })
})
