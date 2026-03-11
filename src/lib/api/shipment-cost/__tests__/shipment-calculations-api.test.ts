import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import {
  calculateShipment,
  confirmShipment,
  recalculateShipment,
} from '../shipment-calculations-api'

describe('shipment-calculations-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateShipment', () => {
    it('calls POST /v1/shipments/:id/calculate with no body', async () => {
      const mockResponse = {
        results: [
          {
            nmId: 123,
            productName: 'Test Product',
            unitCostRub: 100,
            deliveryCostPerUnit: 25.5,
            finalCostPerUnit: 125.5,
            totalUnits: 10,
            finalCostLine: 1255,
          },
        ],
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
      const result = await calculateShipment('s-001')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-001/calculate')
      expect(result.results).toHaveLength(1)
      expect(result.results[0].nmId).toBe(123)
      expect(result.results[0].finalCostPerUnit).toBe(125.5)
    })

    it('propagates errors from apiClient', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'))
      await expect(calculateShipment('s-001')).rejects.toThrow('Network error')
    })
  })

  describe('confirmShipment', () => {
    it('calls POST /v1/shipments/:id/confirm with confirmedBy body', async () => {
      const mockShipment = { id: 's-001', status: 'CONFIRMED', confirmedBy: 'user@test.com' }
      vi.mocked(apiClient.post).mockResolvedValue(mockShipment)
      const result = await confirmShipment('s-001', 'user@test.com')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-001/confirm', {
        confirmedBy: 'user@test.com',
      })
      expect(result.status).toBe('CONFIRMED')
    })

    it('propagates errors from apiClient', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Conflict'))
      await expect(confirmShipment('s-001', 'user@test.com')).rejects.toThrow('Conflict')
    })
  })

  describe('recalculateShipment', () => {
    it('calls POST /v1/shipments/:id/recalculate with no body', async () => {
      const mockResponse = { results: [{ nmId: 456, finalCostPerUnit: 200 }] }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
      const result = await recalculateShipment('s-002')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-002/recalculate')
      expect(result.results[0].nmId).toBe(456)
    })

    it('propagates errors from apiClient', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Forbidden'))
      await expect(recalculateShipment('s-002')).rejects.toThrow('Forbidden')
    })
  })
})
