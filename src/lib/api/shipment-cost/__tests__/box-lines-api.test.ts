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
import { addBoxLine, updateBoxLine, removeBoxLine } from '../box-lines-api'

const mockBoxLine = { id: 'bl-1', palletId: 'p-1', nmId: 123, boxCount: 5 }

describe('box-lines-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addBoxLine', () => {
    it('calls POST with 3-level nesting path including palletId', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockBoxLine)
      const data = { nmId: 123, boxCount: 5 }
      const result = await addBoxLine('s-001', 'p-1', data)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-001/pallets/p-1/box-lines', data)
      expect(result).toEqual(mockBoxLine)
    })

    it('includes totalUnits when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockBoxLine)
      const data = { nmId: 123, boxCount: 5, totalUnits: 25 }
      await addBoxLine('s-001', 'p-1', data)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/shipments/s-001/pallets/p-1/box-lines', data)
    })
  })

  describe('updateBoxLine', () => {
    it('calls PUT with 2-level path (no palletId)', async () => {
      vi.mocked(apiClient.put).mockResolvedValue(mockBoxLine)
      const data = { boxCount: 10 }
      const result = await updateBoxLine('s-001', 'bl-1', data)
      expect(apiClient.put).toHaveBeenCalledWith('/v1/shipments/s-001/box-lines/bl-1', data)
      expect(result).toEqual(mockBoxLine)
    })
  })

  describe('removeBoxLine', () => {
    it('calls DELETE with 2-level path (no palletId)', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await removeBoxLine('s-001', 'bl-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/v1/shipments/s-001/box-lines/bl-1')
    })
  })
})
