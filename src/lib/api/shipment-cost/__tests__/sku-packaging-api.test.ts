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
  getSkuPackaging,
  getSkuPackagingByNmId,
  createSkuPackaging,
  bulkCreateSkuPackaging,
  deleteSkuPackaging,
} from '../sku-packaging-api'

const mockPackaging = {
  nmId: 123,
  cabinetId: 'cab-1',
  boxTypeId: 'bt-001',
  unitsPerBox: 2,
  boxType: {
    id: 'bt-001',
    name: 'Std',
    lengthCm: '40',
    widthCm: '30',
    heightCm: '20',
    volumeCm3: '24000',
    isActive: true,
  },
  product: { nmId: 123, vendorCode: 'VC-1', brand: 'Brand', subject: 'Shoes' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('sku-packaging-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSkuPackaging', () => {
    it('calls GET /v1/sku-packaging without params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockPackaging])
      const result = await getSkuPackaging()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/sku-packaging')
      expect(result).toHaveLength(1)
      expect(result[0].nmId).toBe(123)
      expect(result[0].boxTypeId).toBe('bt-001')
    })

    it('appends ?nmId=123 when nmId param provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockPackaging])
      await getSkuPackaging({ nmId: 123 })
      expect(apiClient.get).toHaveBeenCalledWith('/v1/sku-packaging?nmId=123')
    })

    it('appends ?boxTypeId=bt-001 when boxTypeId param provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockPackaging])
      await getSkuPackaging({ boxTypeId: 'bt-001' })
      expect(apiClient.get).toHaveBeenCalledWith('/v1/sku-packaging?boxTypeId=bt-001')
    })
  })

  describe('getSkuPackagingByNmId', () => {
    it('calls GET /v1/sku-packaging/:nmId', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPackaging)
      const result = await getSkuPackagingByNmId(123)
      expect(apiClient.get).toHaveBeenCalledWith('/v1/sku-packaging/123')
      expect(result.nmId).toBe(123)
      expect(result.boxTypeId).toBe('bt-001')
    })
  })

  describe('createSkuPackaging', () => {
    it('calls POST /v1/sku-packaging with data', async () => {
      const data = { nmId: 456, boxTypeId: 'bt-002', unitsPerBox: 1 }
      vi.mocked(apiClient.post).mockResolvedValue(mockPackaging)
      const result = await createSkuPackaging(data as never)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/sku-packaging', data)
      expect(result.nmId).toBe(123)
    })
  })

  describe('bulkCreateSkuPackaging', () => {
    it('calls POST /v1/sku-packaging/bulk with data', async () => {
      const data = { items: [{ nmId: 1, boxTypeId: 'bt-001', unitsPerBox: 1 }] }
      const response = { created: 1, updated: 0, errors: [] }
      vi.mocked(apiClient.post).mockResolvedValue(response)
      const result = await bulkCreateSkuPackaging(data as never)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/sku-packaging/bulk', data)
      expect(result).toEqual(response)
    })
  })

  describe('deleteSkuPackaging', () => {
    it('calls DELETE /v1/sku-packaging/:nmId', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await deleteSkuPackaging(123)
      expect(apiClient.delete).toHaveBeenCalledWith('/v1/sku-packaging/123')
    })
  })
})
