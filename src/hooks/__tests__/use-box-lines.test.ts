import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import { useAddBoxLine, useUpdateBoxLine, useRemoveBoxLine } from '../use-box-lines'

const mockAddBoxLine = vi.fn()
const mockUpdateBoxLine = vi.fn()
const mockRemoveBoxLine = vi.fn()

vi.mock('@/lib/api/shipment-cost', () => ({
  addBoxLine: (...args: unknown[]) => mockAddBoxLine(...args),
  updateBoxLine: (...args: unknown[]) => mockUpdateBoxLine(...args),
  removeBoxLine: (...args: unknown[]) => mockRemoveBoxLine(...args),
}))

describe('use-box-lines hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAddBoxLine', () => {
    it('calls addBoxLine with shipmentId, palletId, and data', async () => {
      const mockLine = { id: 'bl-1', nmId: 123 }
      mockAddBoxLine.mockResolvedValue(mockLine)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAddBoxLine('s-001', 'p-1'), {
        wrapper: createQueryWrapper(queryClient),
      })

      result.current.mutate({ nmId: 123, boxCount: 5 })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockAddBoxLine).toHaveBeenCalledWith('s-001', 'p-1', { nmId: 123, boxCount: 5 })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments', 'detail', 's-001'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    })

    it('propagates error when addBoxLine rejects', async () => {
      mockAddBoxLine.mockRejectedValueOnce(new Error('Server error'))
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useAddBoxLine('s-001', 'p-1'), {
        wrapper: createQueryWrapper(queryClient),
      })
      result.current.mutate({ nmId: 123, boxCount: 5 })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Server error')
    })
  })

  describe('useUpdateBoxLine', () => {
    it('calls updateBoxLine with shipmentId, boxLineId, and data', async () => {
      const mockLine = { id: 'bl-1', boxCount: 10 }
      mockUpdateBoxLine.mockResolvedValue(mockLine)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateBoxLine('s-001'), {
        wrapper: createQueryWrapper(queryClient),
      })

      result.current.mutate({ boxLineId: 'bl-1', data: { boxCount: 10 } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockUpdateBoxLine).toHaveBeenCalledWith('s-001', 'bl-1', { boxCount: 10 })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments', 'detail', 's-001'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    })

    it('propagates error when updateBoxLine rejects', async () => {
      mockUpdateBoxLine.mockRejectedValueOnce(new Error('Update failed'))
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useUpdateBoxLine('s-001'), {
        wrapper: createQueryWrapper(queryClient),
      })
      result.current.mutate({ boxLineId: 'bl-1', data: { boxCount: 10 } })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Update failed')
    })
  })

  describe('useRemoveBoxLine', () => {
    it('calls removeBoxLine with shipmentId and boxLineId', async () => {
      mockRemoveBoxLine.mockResolvedValue(undefined)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useRemoveBoxLine('s-001'), {
        wrapper: createQueryWrapper(queryClient),
      })

      result.current.mutate('bl-1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockRemoveBoxLine).toHaveBeenCalledWith('s-001', 'bl-1')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments', 'detail', 's-001'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    })

    it('propagates error when removeBoxLine rejects', async () => {
      mockRemoveBoxLine.mockRejectedValueOnce(new Error('Delete failed'))
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useRemoveBoxLine('s-001'), {
        wrapper: createQueryWrapper(queryClient),
      })
      result.current.mutate('bl-1')
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Delete failed')
    })
  })
})
