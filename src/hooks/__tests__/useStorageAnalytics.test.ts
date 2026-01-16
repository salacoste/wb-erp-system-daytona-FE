/**
 * Unit tests for Storage Analytics hooks
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useStorageBySku,
  useStorageTopConsumers,
  useStorageTrends,
  usePaidStorageImport,
  useImportStatus,
  storageQueryKeys,
} from '../useStorageAnalytics'
import { createQueryWrapper } from '@/test/utils/test-utils'
import {
  mockStorageBySkuResponse,
  mockEmptyStorageBySkuResponse,
  mockTopConsumersResponse,
  mockStorageTrendsResponse,
  mockPaidStorageImportResponse,
  mockImportStatusCompleted,
  mockImportStatusProcessing,
} from '@/test/fixtures/storage-analytics'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Import mocked apiClient after mock setup
import { apiClient } from '@/lib/api-client'

describe('Storage Analytics Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Query Keys Tests
  // ==========================================================================

  describe('storageQueryKeys', () => {
    it('generates correct base key', () => {
      expect(storageQueryKeys.all).toEqual(['storage'])
    })

    it('generates correct bySku key with params', () => {
      const params = { weekStart: '2025-W44', weekEnd: '2025-W47' }
      const key = storageQueryKeys.bySku(params)
      expect(key).toEqual(['storage', 'by-sku', params])
    })

    it('generates correct topConsumers key with params', () => {
      const params = { weekStart: '2025-W44', weekEnd: '2025-W47', limit: 5 }
      const key = storageQueryKeys.topConsumers(params)
      expect(key).toEqual(['storage', 'top-consumers', params])
    })

    it('generates correct trends key with params', () => {
      const params = { weekStart: '2025-W44', weekEnd: '2025-W47' }
      const key = storageQueryKeys.trends(params)
      expect(key).toEqual(['storage', 'trends', params])
    })

    it('generates correct importStatus key', () => {
      const key = storageQueryKeys.importStatus('import-123')
      expect(key).toEqual(['storage', 'import', 'import-123'])
    })
  })

  // ==========================================================================
  // useStorageBySku Tests
  // ==========================================================================

  describe('useStorageBySku', () => {
    it('fetches storage data for given week range', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageBySkuResponse)

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStorageBySkuResponse)
      expect(result.current.data?.data).toHaveLength(3)
    })

    it('passes brand filter to API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageBySkuResponse)

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47', { brand: 'RepairPro' }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('brand=RepairPro')
      )
    })

    it('passes warehouse filter to API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageBySkuResponse)

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47', { warehouse: 'Коледино' }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('warehouse=')
      )
    })

    it('handles pagination cursor', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageBySkuResponse)

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47', { cursor: 'abc123' }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('cursor=abc123')
      )
    })

    it('returns loading state initially', () => {
      vi.mocked(apiClient.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('returns error on API failure', async () => {
      // Mock to reject on all calls (including retries)
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      })

      expect(result.current.error?.message).toBe('API Error')
    })

    it('respects enabled option', async () => {
      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47', { enabled: false }),
        { wrapper: createQueryWrapper() }
      )

      // Should not make API call when disabled
      expect(apiClient.get).not.toHaveBeenCalled()
      expect(result.current.isPending).toBe(true)
    })

    it('handles empty data response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockEmptyStorageBySkuResponse)

      const { result } = renderHook(
        () => useStorageBySku('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toEqual([])
      expect(result.current.data?.has_data).toBe(false)
    })
  })

  // ==========================================================================
  // useStorageTopConsumers Tests
  // ==========================================================================

  describe('useStorageTopConsumers', () => {
    it('fetches top consumers for given week range', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockTopConsumersResponse)

      const { result } = renderHook(
        () => useStorageTopConsumers('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.top_consumers).toHaveLength(5)
      expect(result.current.data?.total_storage_cost).toBe(4240.75)
    })

    it('passes limit parameter to API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockTopConsumersResponse)

      const { result } = renderHook(
        () => useStorageTopConsumers('2025-W44', '2025-W47', { limit: 10 }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      )
    })

    it('passes include_revenue flag to API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockTopConsumersResponse)

      const { result } = renderHook(
        () => useStorageTopConsumers('2025-W44', '2025-W47', { include_revenue: true }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('include_revenue=true')
      )
    })

    it('returns error on API failure', async () => {
      // Mock to reject on all calls (including retries)
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network Error'))

      const { result } = renderHook(
        () => useStorageTopConsumers('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      })

      expect(result.current.error?.message).toBe('Network Error')
    })
  })

  // ==========================================================================
  // useStorageTrends Tests
  // ==========================================================================

  describe('useStorageTrends', () => {
    it('fetches trends for given week range', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageTrendsResponse)

      const { result } = renderHook(
        () => useStorageTrends('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toHaveLength(4)
      expect(result.current.data?.summary?.storage_cost?.trend).toBe(14.3)
    })

    it('passes nm_id filter for single product trend', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        ...mockStorageTrendsResponse,
        nm_id: '147205694',
      })

      const { result } = renderHook(
        () => useStorageTrends('2025-W44', '2025-W47', { nm_id: '147205694' }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('nm_id=147205694')
      )
    })

    it('passes metrics parameter to API', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageTrendsResponse)

      const { result } = renderHook(
        () => useStorageTrends('2025-W44', '2025-W47', { metrics: ['storage_cost', 'volume'] }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // URL encoding may encode commas, so check both parts are present
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringMatching(/metrics=.*storage_cost.*volume|metrics=.*volume.*storage_cost/)
      )
    })

    it('handles null data points in response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockStorageTrendsResponse)

      const { result } = renderHook(
        () => useStorageTrends('2025-W44', '2025-W47'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Week 46 has null storage_cost (gap)
      const week46 = result.current.data?.data.find(d => d.week === '2025-W46')
      expect(week46?.storage_cost).toBeNull()
    })
  })

  // ==========================================================================
  // usePaidStorageImport Tests
  // ==========================================================================

  describe('usePaidStorageImport', () => {
    it('triggers import mutation successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockPaidStorageImportResponse)

      const onSuccess = vi.fn()
      const { result } = renderHook(
        () => usePaidStorageImport({ onSuccess }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate({ dateFrom: '2025-11-18', dateTo: '2025-11-24' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/imports/paid-storage',
        { date_from: '2025-11-18', date_to: '2025-11-24' }
      )
      expect(onSuccess).toHaveBeenCalledWith(mockPaidStorageImportResponse)
    })

    it('calls onError callback on failure', async () => {
      const error = new Error('Import failed')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      const onError = vi.fn()
      const { result } = renderHook(
        () => usePaidStorageImport({ onError }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate({ dateFrom: '2025-11-18', dateTo: '2025-11-24' })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(onError).toHaveBeenCalledWith(error)
    })

    it('returns isPending state during mutation', async () => {
      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(
        () => usePaidStorageImport(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate({ dateFrom: '2025-11-18', dateTo: '2025-11-24' })

      // Wait for mutation state to update
      await waitFor(() => expect(result.current.isPending).toBe(true))
    })
  })

  // ==========================================================================
  // useImportStatus Tests
  // ==========================================================================

  describe('useImportStatus', () => {
    it('fetches import status for given importId', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockImportStatusCompleted)

      const { result } = renderHook(
        () => useImportStatus('import-uuid-12345'),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.status).toBe('completed')
      expect(result.current.data?.rows_imported).toBe(3500)
    })

    it('does not fetch when importId is null', () => {
      const { result } = renderHook(
        () => useImportStatus(null),
        { wrapper: createQueryWrapper() }
      )

      expect(apiClient.get).not.toHaveBeenCalled()
      expect(result.current.isPending).toBe(true)
    })

    it('supports refetchInterval for polling', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockImportStatusProcessing)

      const { result } = renderHook(
        () => useImportStatus('import-uuid-12345', { refetchInterval: 2000 }),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // First call should happen
      expect(apiClient.get).toHaveBeenCalledTimes(1)
      expect(result.current.data?.status).toBe('processing')
    })

    it('respects enabled option', () => {
      const { result } = renderHook(
        () => useImportStatus('import-uuid-12345', { enabled: false }),
        { wrapper: createQueryWrapper() }
      )

      expect(apiClient.get).not.toHaveBeenCalled()
      expect(result.current.isPending).toBe(true)
    })
  })
})
