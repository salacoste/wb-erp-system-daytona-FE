/**
 * Unit tests for useBulkCogsAssignment hook with marginRecalculation field
 * Request #118/119 - Backend fix for automatic margin recalculation
 * Reference: docs/pages/products/COGS-BULK-UPLOAD-CHANGES.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBulkCogsAssignment } from '../useBulkCogsAssignment'
import { createQueryWrapper } from '@/test/utils/test-utils'
import type { BulkCogsUploadResponse, BulkCogsUploadResponseLegacy } from '@/types/cogs'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

// Mock query client
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

import { apiClient } from '@/lib/api-client'

describe('useBulkCogsAssignment - with marginRecalculation field', () => {
  const mockItems = [
    { nm_id: '12345678', unit_cost_rub: 1250.5, valid_from: '2026-01-30' },
    { nm_id: '87654321', unit_cost_rub: 850.0, valid_from: '2026-01-30' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // F-34: the REAL backend shape today is the LEGACY { totalItems, createdItems,
  // skippedItems, errors } (the endpoint ignores ?format=v2). This pins that the
  // hook normalizes it correctly through the full pipeline (the other tests mock
  // the v2-wrapped shape, which exercises the normalizer's defensive descent).
  // ==========================================================================
  describe('F-34 legacy backend shape (real production path)', () => {
    it('normalizes the legacy { createdItems/skippedItems/errors } shape to the flat summary', async () => {
      const legacy = {
        totalItems: 2,
        createdItems: 2,
        skippedItems: 0,
        errors: [],
      } as unknown as BulkCogsUploadResponseLegacy

      vi.mocked(apiClient.post).mockResolvedValue(legacy)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.succeeded).toBe(2)
      expect(result.current.data?.failed).toBe(0)
      // marginRecalculation is v2-only — undefined on the legacy path (per #186).
      expect(result.current.data?.marginRecalculation).toBeUndefined()
    })

    it('maps legacy errors[] to results with success:false (failed-item retry source)', async () => {
      const legacy = {
        totalItems: 2,
        createdItems: 1,
        skippedItems: 1,
        errors: [{ nm_id: '12345678', error: 'duplicate valid_from' }],
      } as unknown as BulkCogsUploadResponseLegacy

      vi.mocked(apiClient.post).mockResolvedValue(legacy)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.succeeded).toBe(1)
      expect(result.current.data?.failed).toBe(1)
      expect(result.current.data?.results).toEqual([
        { nm_id: '12345678', success: false, error_message: 'duplicate valid_from' },
      ])
    })
  })

  // ==========================================================================
  // Margin Recalculation Field Tests (Request #118/119)
  // ==========================================================================

  describe('marginRecalculation field handling', () => {
    it('should extract marginRecalculation from response when present', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'COGS assigned successfully',
          marginRecalculation: {
            weeks: ['2026-W03', '2026-W04'],
            status: 'pending',
            taskId: 'task_abc123',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation).toEqual({
        weeks: ['2026-W03', '2026-W04'],
        status: 'pending',
        taskId: 'task_abc123',
      })
    })

    it('should handle response without marginRecalculation field', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 5,
          failed: 0,
          results: [],
          message: 'COGS assigned successfully',
          // marginRecalculation field ABSENT (no sales data)
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation).toBeUndefined()
    })

    it('should log marginRecalculation info to console', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'COGS assigned successfully',
          marginRecalculation: {
            weeks: ['2026-W03'],
            status: 'in_progress',
            taskId: 'task_xyz789',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Check that console.log was called with margin recalculation info
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Margin Recalculation:'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Status: in_progress'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Weeks: 2026-W03'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Task ID: task_xyz789'))

      consoleLogSpy.mockRestore()
    })

    it('should log "Not triggered" message when marginRecalculation is absent with successful items', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 5,
          failed: 0,
          results: [],
          message: 'COGS assigned successfully',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Check that console.log was called with "Not triggered" message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Margin Recalculation: Not triggered')
      )

      consoleLogSpy.mockRestore()
    })
  })

  // ==========================================================================
  // Backward Compatibility Tests
  // ==========================================================================

  describe('backward compatibility', () => {
    it('should handle old response format without marginRecalculation', async () => {
      const oldResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 3,
          failed: 0,
          results: [],
          message: 'Success',
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(oldResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Should still work with old format
      expect(result.current.data?.succeeded).toBe(3)
      expect(result.current.data?.marginRecalculation).toBeUndefined()
    })
  })

  // ==========================================================================
  // Margin Recalculation Status Values Tests
  // ==========================================================================

  describe('marginRecalculation status values', () => {
    it('should handle "pending" status', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: ['2026-W03'],
            status: 'pending',
            taskId: 'task_pending',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.status).toBe('pending')
    })

    it('should handle "in_progress" status', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: ['2026-W03', '2026-W04'],
            status: 'in_progress',
            taskId: 'task_progress',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.status).toBe('in_progress')
    })

    it('should handle "completed" status', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: ['2026-W03'],
            status: 'completed',
            taskId: 'task_completed',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.status).toBe('completed')
    })
  })

  // ==========================================================================
  // Weeks Array Tests
  // ==========================================================================

  describe('marginRecalculation weeks array', () => {
    it('should handle single week in weeks array', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 5,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: ['2026-W03'],
            status: 'pending',
            taskId: 'task_single_week',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.weeks).toEqual(['2026-W03'])
    })

    it('should handle multiple weeks in weeks array', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 10,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: ['2026-W03', '2026-W04', '2026-W05'],
            status: 'pending',
            taskId: 'task_multiple_weeks',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.weeks).toEqual([
        '2026-W03',
        '2026-W04',
        '2026-W05',
      ])
    })

    it('should handle empty weeks array', async () => {
      const mockResponse: BulkCogsUploadResponse = {
        data: {
          succeeded: 5,
          failed: 0,
          results: [],
          message: 'Success',
          marginRecalculation: {
            weeks: [],
            status: 'pending',
            taskId: 'task_empty_weeks',
          },
        },
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useBulkCogsAssignment(), {
        wrapper: createQueryWrapper(),
      })

      await act(async () => {
        await result.current.mutate({ items: mockItems })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.marginRecalculation?.weeks).toEqual([])
    })
  })
})
