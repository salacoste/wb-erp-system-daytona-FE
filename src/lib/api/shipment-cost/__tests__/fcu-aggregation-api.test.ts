import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import { getFcuBySku } from '../fcu-aggregation-api'

const mockFcuData = [
  {
    nmId: 12345,
    productName: 'Test Product',
    latestPcu: 150.5,
    latestDcu: 25.3,
    latestFcu: 175.8,
    shipmentId: 'ship-001',
    shipmentName: 'Shipment 1',
    confirmedAt: '2026-03-10T12:00:00Z',
  },
]

describe('fcu-aggregation-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFcuBySku', () => {
    it('calls GET /v1/shipment-cost/by-sku without week param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFcuData)
      const result = await getFcuBySku()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipment-cost/by-sku')
      expect(result).toEqual(mockFcuData)
    })

    it('calls GET /v1/shipment-cost/by-sku with week param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFcuData)
      const result = await getFcuBySku('2026-W10')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipment-cost/by-sku?week=2026-W10')
      expect(result).toEqual(mockFcuData)
    })

    it('encodes special characters in week param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      await getFcuBySku('2026-W10&inject=bad')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/shipment-cost/by-sku?week=2026-W10%26inject%3Dbad'
      )
    })

    it('returns empty array when no data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      const result = await getFcuBySku('2026-W10')
      expect(result).toEqual([])
    })

    it('does not use skipDataUnwrap (standard auto-unwrap)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFcuData)
      await getFcuBySku()
      // Should NOT pass skipDataUnwrap option (unlike getShipments)
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipment-cost/by-sku')
      expect(apiClient.get).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ skipDataUnwrap: true })
      )
    })
  })
})
