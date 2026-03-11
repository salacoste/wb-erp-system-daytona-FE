import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  addPallet,
  removePallet,
} from '../shipments-api'
import { DeliveryMode, ShipmentStatus } from '@/types/shipment-cost'

const mockShipment = { id: 's-001', name: 'Test', status: ShipmentStatus.DRAFT }

describe('shipments-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getShipments', () => {
    it('calls GET /v1/shipments with skipDataUnwrap by default', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockShipment], total: 1 })
      const result = await getShipments()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipments', { skipDataUnwrap: true })
      expect(result.data).toEqual([mockShipment])
    })

    it('appends query params when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [], total: 0 })
      await getShipments({ status: ShipmentStatus.DRAFT, page: 2, limit: 20 })
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipments?status=DRAFT&page=2&limit=20', {
        skipDataUnwrap: true,
      })
    })
  })

  describe('getShipment', () => {
    it('calls GET /v1/shipments/:id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockShipment)
      const result = await getShipment('s-001')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/shipments/s-001')
      expect(result).toEqual(mockShipment)
    })
  })

  describe('createShipment', () => {
    it('calls POST /v1/shipments with data', async () => {
      const data = {
        name: 'New Shipment',
        deliveryMode: DeliveryMode.FIXED_VEHICLE,
        totalDeliveryCost: 15000,
        createdBy: 'test@test.com',
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockShipment)
      const result = await createShipment(data)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments', data)
      expect(result).toEqual(mockShipment)
    })
  })

  describe('updateShipment', () => {
    it('calls PUT /v1/shipments/:id with data', async () => {
      const data = { name: 'Updated' }
      vi.mocked(apiClient.put).mockResolvedValue(mockShipment)
      const result = await updateShipment('s-001', data)
      expect(apiClient.put).toHaveBeenCalledWith('/v1/shipments/s-001', data)
      expect(result).toEqual(mockShipment)
    })
  })

  describe('deleteShipment', () => {
    it('calls DELETE /v1/shipments/:id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await deleteShipment('s-001')
      expect(apiClient.delete).toHaveBeenCalledWith('/v1/shipments/s-001')
    })
  })

  describe('addPallet', () => {
    it('calls POST /v1/shipments/:id/pallets with no body', async () => {
      const mockPallet = { id: 'p-1', shipmentId: 's-001', palletNumber: 1 }
      vi.mocked(apiClient.post).mockResolvedValue(mockPallet)
      const result = await addPallet('s-001')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-001/pallets')
      expect(result).toEqual(mockPallet)
    })
  })

  describe('removePallet', () => {
    it('calls DELETE /v1/shipments/:id/pallets/:palletId', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await removePallet('s-001', 'p-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/v1/shipments/s-001/pallets/p-1')
    })
  })
})
