/**
 * Monitoring API client tests — Epic 68-FE
 * Focus: getTelegramHealth must NOT send `days` — the endpoint rejects it with
 * HTTP 400 "property days should not exist" (request #149). The health-reports
 * endpoint legitimately accepts `days` (regression guard kept here).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getTelegramHealth, getHealthReports } from '../monitoring'

describe('monitoring API — getTelegramHealth', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('requests telegram-health WITHOUT a days query param', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
    await getTelegramHealth('cab-1')
    const url = vi.mocked(apiClient.get).mock.calls[0][0]
    expect(url).toContain('/v1/monitoring/telegram-health')
    expect(url).toContain('cabinetId=cab-1')
    expect(url).not.toContain('days')
  })

  it('still sends days to health-reports (must remain unaffected)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([] as never)
    await getHealthReports('cab-1', 7)
    const url = vi.mocked(apiClient.get).mock.calls[0][0]
    expect(url).toContain('/v1/monitoring/health-reports')
    expect(url).toContain('days=7')
  })
})
