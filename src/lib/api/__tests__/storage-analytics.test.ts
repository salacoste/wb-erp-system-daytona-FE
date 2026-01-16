/**
 * Unit tests for Storage Analytics API Client
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getStorageBySku,
  getStorageTopConsumers,
  getStorageTrends,
  triggerPaidStorageImport,
  getImportStatus,
} from '../storage-analytics'
import { apiClient } from '../../api-client'

// Mock the API client
vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock console.info to reduce test noise
vi.spyOn(console, 'info').mockImplementation(() => {})

describe('Storage Analytics API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStorageBySku', () => {
    const mockResponse = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      data: [
        {
          nm_id: '147205694',
          vendor_code: 'SKU-001',
          product_name: 'Test Product',
          brand: 'TestBrand',
          storage_cost_total: 1500.5,
          storage_cost_avg_daily: 53.59,
          volume_avg: 0.5,
          warehouses: ['Коледино', 'Подольск'],
          days_stored: 28,
        },
      ],
      summary: {
        total_storage_cost: 1500.5,
        products_count: 1,
        avg_cost_per_product: 1500.5,
      },
      pagination: { total: 1, cursor: null, has_more: false },
      has_data: true,
    }

    it('calls API with correct endpoint and params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/storage/by-sku?'),
      )
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('weekStart=2025-W44'),
      )
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('weekEnd=2025-W47'),
      )
    })

    it('includes optional filters in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        nm_id: '147205694',
        brand: 'TestBrand',
        warehouse: 'Коледино',
        sort_by: 'storage_cost',
        sort_order: 'desc',
        limit: 50,
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('nm_id=147205694')
      expect(call).toContain('brand=TestBrand')
      expect(call).toContain('sort_by=storage_cost')
      expect(call).toContain('sort_order=desc')
      expect(call).toContain('limit=50')
    })

    it('returns response data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
      expect(result.has_data).toBe(true)
    })

    it('handles array response (apiClient unwrap bug)', async () => {
      // When apiClient incorrectly unwraps, we get just the data array
      const dataArray = mockResponse.data
      vi.mocked(apiClient.get).mockResolvedValue(dataArray)

      const result = await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      // Should reconstruct response structure
      expect(result.data).toEqual(dataArray)
      expect(result.period.from).toBe('2025-W44')
      expect(result.period.to).toBe('2025-W47')
      expect(result.has_data).toBe(true)
    })

    it('omits undefined params from query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        nm_id: undefined,
        brand: undefined,
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).not.toContain('nm_id=')
      expect(call).not.toContain('brand=')
    })
  })

  describe('getStorageTopConsumers', () => {
    const mockResponse = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      top_consumers: [
        {
          rank: 1,
          nm_id: '456789012',
          vendor_code: 'SKU-001',
          product_name: 'Top Product',
          brand: 'TopBrand',
          storage_cost: 2500.0,
          percent_of_total: 49.5,
          volume: 1.2,
          storage_to_revenue_ratio: 26.25,
        },
      ],
      total_storage_cost: 5050.5,
      has_data: true,
    }

    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTopConsumers({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/storage/top-consumers?'),
      )
    })

    it('includes limit and include_revenue params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTopConsumers({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        limit: 10,
        include_revenue: true,
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('limit=10')
      expect(call).toContain('include_revenue=true')
    })

    it('returns top consumers data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getStorageTopConsumers({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(result.top_consumers).toHaveLength(1)
      expect(result.top_consumers[0].rank).toBe(1)
      expect(result.total_storage_cost).toBe(5050.5)
    })
  })

  describe('getStorageTrends', () => {
    const mockResponse = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      nm_id: null,
      data: [
        { week: '2025-W44', storage_cost: 1200.5, volume: 45.2 },
        { week: '2025-W45', storage_cost: 1350.0, volume: 48.5 },
        { week: '2025-W46', storage_cost: 1100.0, volume: 42.0 },
        { week: '2025-W47', storage_cost: 1400.0, volume: 50.0 },
      ],
      summary: {
        storage_cost: { min: 1100.0, max: 1400.0, avg: 1262.625, trend: 16.66 },
      },
      has_data: true,
    }

    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/storage/trends?'),
      )
    })

    it('includes metrics array in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        metrics: ['storage_cost', 'volume'],
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      // Array should be joined with comma
      expect(call).toMatch(/metrics=storage_cost.*volume|metrics=.*storage_cost,volume/)
    })

    it('includes nm_id filter for product-specific trends', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        nm_id: '147205694',
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('nm_id=147205694')
    })

    it('returns trends data with summary', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(result.data).toHaveLength(4)
      expect(result.summary?.storage_cost?.min).toBe(1100.0)
      expect(result.summary?.storage_cost?.max).toBe(1400.0)
      expect(result.summary?.storage_cost?.avg).toBe(1262.625)
    })

    it('handles array response (apiClient unwrap bug)', async () => {
      const dataArray = mockResponse.data
      vi.mocked(apiClient.get).mockResolvedValue(dataArray)

      const result = await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
      })

      expect(result.data).toEqual(dataArray)
      expect(result.period.from).toBe('2025-W44')
      expect(result.has_data).toBe(true)
    })
  })

  describe('triggerPaidStorageImport', () => {
    const mockResponse = {
      import_id: 'import-uuid-123',
      status: 'pending' as const,
      message: 'Import queued successfully',
      estimated_time_sec: 120,
    }

    it('calls API with correct endpoint and body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await triggerPaidStorageImport({
        dateFrom: '2025-11-18',
        dateTo: '2025-11-24',
      })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/imports/paid-storage',
        {
          date_from: '2025-11-18',
          date_to: '2025-11-24',
        },
      )
    })

    it('returns import response with id and status', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await triggerPaidStorageImport({
        dateFrom: '2025-11-18',
        dateTo: '2025-11-24',
      })

      expect(result.import_id).toBe('import-uuid-123')
      expect(result.status).toBe('pending')
      expect(result.estimated_time_sec).toBe(120)
    })
  })

  describe('getImportStatus', () => {
    it('calls API with correct endpoint', async () => {
      const mockResponse = {
        import_id: 'import-uuid-123',
        status: 'completed' as const,
        rows_imported: 1500,
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getImportStatus('import-uuid-123')

      expect(apiClient.get).toHaveBeenCalledWith('/v1/imports/import-uuid-123')
    })

    it('returns completed status with row count', async () => {
      const mockResponse = {
        import_id: 'import-uuid-123',
        status: 'completed' as const,
        rows_imported: 1500,
        completed_at: '2025-11-24T12:00:00Z',
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getImportStatus('import-uuid-123')

      expect(result.status).toBe('completed')
      expect(result.rows_imported).toBe(1500)
      expect(result.completed_at).toBe('2025-11-24T12:00:00Z')
    })

    it('returns processing status', async () => {
      const mockResponse = {
        import_id: 'import-uuid-123',
        status: 'processing' as const,
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getImportStatus('import-uuid-123')

      expect(result.status).toBe('processing')
    })

    it('returns failed status with error message', async () => {
      const mockResponse = {
        import_id: 'import-uuid-123',
        status: 'failed' as const,
        error_message: 'WB API timeout',
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getImportStatus('import-uuid-123')

      expect(result.status).toBe('failed')
      expect(result.error_message).toBe('WB API timeout')
    })
  })

  describe('Query String Building', () => {
    it('handles null values by omitting them', async () => {
      const mockResponse = {
        period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
        data: [],
        summary: { total_storage_cost: 0, products_count: 0, avg_cost_per_product: 0 },
        pagination: { total: 0, cursor: null, has_more: false },
        has_data: false,
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageBySku({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        cursor: null as unknown as string,
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).not.toContain('cursor=null')
    })

    it('handles empty array metrics', async () => {
      const mockResponse = {
        period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
        nm_id: null,
        data: [],
        has_data: false,
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getStorageTrends({
        weekStart: '2025-W44',
        weekEnd: '2025-W47',
        metrics: [],
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      // Empty array should not be included
      expect(call).not.toContain('metrics=')
    })
  })
})
