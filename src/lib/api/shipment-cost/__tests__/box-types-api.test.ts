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
  getBoxTypes,
  getBoxType,
  createBoxType,
  updateBoxType,
  deactivateBoxType,
} from '../box-types-api'

const mockBoxType = { id: 'bt-001', name: 'Small', isActive: true }

describe('box-types-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBoxTypes', () => {
    it('calls GET /v1/box-types without params by default', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockBoxType])
      const result = await getBoxTypes()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/box-types')
      expect(result).toEqual([mockBoxType])
    })

    it('appends ?includeInactive=true when flag is set', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([mockBoxType])
      await getBoxTypes(true)
      expect(apiClient.get).toHaveBeenCalledWith('/v1/box-types?includeInactive=true')
    })
  })

  describe('getBoxType', () => {
    it('calls GET /v1/box-types/:id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBoxType)
      const result = await getBoxType('bt-001')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/box-types/bt-001')
      expect(result).toEqual(mockBoxType)
    })
  })

  describe('createBoxType', () => {
    it('calls POST /v1/box-types with data', async () => {
      const data = { name: 'Medium', lengthCm: 30, widthCm: 20, heightCm: 15 }
      vi.mocked(apiClient.post).mockResolvedValue(mockBoxType)
      const result = await createBoxType(data as never)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/box-types', data)
      expect(result).toEqual(mockBoxType)
    })
  })

  describe('updateBoxType', () => {
    it('calls PUT /v1/box-types/:id with data', async () => {
      const data = { name: 'Large' }
      vi.mocked(apiClient.put).mockResolvedValue(mockBoxType)
      const result = await updateBoxType('bt-001', data as never)
      expect(apiClient.put).toHaveBeenCalledWith('/v1/box-types/bt-001', data)
      expect(result).toEqual(mockBoxType)
    })
  })

  describe('deactivateBoxType', () => {
    it('calls DELETE /v1/box-types/:id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(mockBoxType)
      const result = await deactivateBoxType('bt-001')
      expect(apiClient.delete).toHaveBeenCalledWith('/v1/box-types/bt-001')
      expect(result).toEqual(mockBoxType)
    })
  })
})
