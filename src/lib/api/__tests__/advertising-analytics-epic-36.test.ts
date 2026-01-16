/**
 * Integration tests for Epic 36: Product Card Linking (Склейки)
 * Story 36.5-FE: Testing & Documentation - Phase 2
 *
 * Tests API client integration with Epic 36 backend features:
 * - group_by parameter handling
 * - Epic 36 response field mapping (type, imtId, mergedProducts)
 * - Backward compatibility with Epic 33
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAdvertisingAnalytics } from '../advertising-analytics'
import { apiClient } from '../../api-client'

// Mock the API client
vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock console.info to reduce test noise
vi.spyOn(console, 'info').mockImplementation(() => {})

describe('Advertising Analytics API Client - Epic 36', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('group_by parameter handling', () => {
    const mockResponse = {
      period: { from: '2025-12-01', to: '2025-12-21' },
      items: [
        {
          key: 'item-1',
          nmId: 147205694,
          type: 'individual',
          spend: 1000,
          revenue: 5000,
        },
      ],
      summary: {
        total_spend: 1000,
        total_revenue: 5000,
        roas: 5.0,
        roi: 400,
      },
    }

    it('defaults to group_by=sku when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('group_by=sku')
    })

    it('sends group_by=imtId when specified', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('group_by=imtId')
    })

    it('sends group_by=sku when explicitly specified', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('group_by=sku')
    })

    it('includes group_by in console logging', async () => {
      const mockConsoleInfo = vi.spyOn(console, 'info')
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[Advertising Analytics] Fetching analytics:',
        expect.objectContaining({
          group_by: 'imtId',
        }),
      )
    })
  })

  describe('Epic 36 response field mapping - merged groups', () => {
    it('maps merged group fields correctly', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'imtid-123456',
            imtId: 123456,
            type: 'merged_group',
            mergedProducts: [
              { nmId: 147205694, vendorCode: 'SKU-001' },
              { nmId: 147205695, vendorCode: 'SKU-002' },
              { nmId: 147205696, vendorCode: 'SKU-003' },
            ],
            spend: 3000,
            revenue: 15000,
            roas: 5.0,
            roi: 400,
            conversions: 25,
            efficiency_status: 'excellent',
          },
        ],
        summary: {
          total_spend: 3000,
          total_revenue: 15000,
          roas: 5.0,
          roi: 400,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      const firstItem = result.data[0]
      expect(firstItem.type).toBe('merged_group')
      expect(firstItem.imtId).toBe(123456)
      expect(firstItem.mergedProducts).toHaveLength(3)
      expect(firstItem.mergedProducts![0]).toEqual({
        nmId: 147205694,
        vendorCode: 'SKU-001',
      })
      expect(firstItem.mergedProducts![1]).toEqual({
        nmId: 147205695,
        vendorCode: 'SKU-002',
      })
      expect(firstItem.mergedProducts![2]).toEqual({
        nmId: 147205696,
        vendorCode: 'SKU-003',
      })
    })

    it('handles null imtId correctly', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            type: 'individual',
            imtId: null,
            spend: 1000,
            revenue: 5000,
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })

      expect(result.data[0].imtId).toBeNull()
      expect(result.data[0].type).toBe('individual')
    })

    it('handles undefined imtId (backward compatibility)', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            spend: 1000,
            revenue: 5000,
            // No type or imtId fields (Epic 33 response)
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })

      expect(result.data[0].type).toBeUndefined()
      expect(result.data[0].imtId).toBeNull() // Maps undefined to null
      expect(result.data[0].mergedProducts).toBeUndefined()
    })
  })

  describe('Epic 36 response field mapping - individual products', () => {
    it('maps individual product fields correctly', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            type: 'individual',
            imtId: 123456,
            mergedProducts: [{ nmId: 147205694, vendorCode: 'SKU-001' }],
            spend: 1000,
            revenue: 5000,
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(result.data[0].type).toBe('individual')
      expect(result.data[0].imtId).toBe(123456)
      expect(result.data[0].mergedProducts).toHaveLength(1)
    })

    it('handles individual product without mergedProducts array', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            type: 'individual',
            imtId: null,
            spend: 1000,
            revenue: 5000,
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })

      expect(result.data[0].type).toBe('individual')
      expect(result.data[0].mergedProducts).toBeUndefined()
    })
  })

  describe('mergedProducts array mapping', () => {
    it('maps empty mergedProducts array correctly', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            type: 'merged_group',
            imtId: 123456,
            mergedProducts: [],
            spend: 1000,
            revenue: 5000,
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(result.data[0].mergedProducts).toEqual([])
    })

    it('preserves all mergedProducts fields', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            imtId: 123456,
            type: 'merged_group',
            mergedProducts: [
              { nmId: 147205694, vendorCode: 'SKU-001' },
              { nmId: 147205695, vendorCode: 'SKU-002' },
            ],
            spend: 2000,
            revenue: 10000,
          },
        ],
        summary: {
          total_spend: 2000,
          total_revenue: 10000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      const products = result.data[0].mergedProducts!
      expect(products[0].nmId).toBe(147205694)
      expect(products[0].vendorCode).toBe('SKU-001')
      expect(products[1].nmId).toBe(147205695)
      expect(products[1].vendorCode).toBe('SKU-002')
    })
  })

  describe('backward compatibility with Epic 33', () => {
    it('handles response without Epic 36 fields', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            spend: 1000,
            revenue: 5000,
            roas: 5.0,
            roi: 400,
            conversions: 10,
            efficiency_status: 'excellent',
            // No Epic 36 fields
          },
        ],
        summary: {
          total_spend: 1000,
          total_revenue: 5000,
          roas: 5.0,
          roi: 400,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].sku_id).toBe('147205694')
      expect(result.data[0].spend).toBe(1000)
      expect(result.data[0].type).toBeUndefined()
      expect(result.data[0].mergedProducts).toBeUndefined()
    })

    it('preserves all Epic 33 fields when Epic 36 fields present', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'item-1',
            nmId: 147205694,
            type: 'merged_group',
            imtId: 123456,
            mergedProducts: [
              { nmId: 147205694, vendorCode: 'SKU-001' },
              { nmId: 147205695, vendorCode: 'SKU-002' },
            ],
            spend: 2000,
            revenue: 10000,
            roas: 5.0,
            roi: 400,
            conversions: 20,
            ctr: 2.5,
            efficiency_status: 'excellent',
            total_sales: 12000,
            organic_sales: 2000,
            organic_contribution: 16.67,
            profit: 3000,
            profit_after_ads: 1000,
          },
        ],
        summary: {
          total_spend: 2000,
          total_revenue: 10000,
          roas: 5.0,
          roi: 400,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      const item = result.data[0]
      // Epic 33 fields preserved
      expect(item.spend).toBe(2000)
      expect(item.revenue).toBe(10000)
      expect(item.roas).toBe(5.0)
      expect(item.roi).toBe(400)
      expect(item.orders).toBe(20)
      expect(item.ctr).toBe(2.5)
      expect(item.efficiency_status).toBe('excellent')
      // Epic 36 fields added
      expect(item.type).toBe('merged_group')
      expect(item.imtId).toBe(123456)
      expect(item.mergedProducts).toHaveLength(2)
    })
  })

  describe('integration with other query parameters', () => {
    it('combines group_by with view_by parameter', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [],
        summary: { total_spend: 0, total_revenue: 0 },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        view_by: 'sku',
        group_by: 'imtId',
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('view_by=sku')
      expect(call).toContain('group_by=imtId')
    })

    it('combines group_by with filters and pagination', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [],
        summary: { total_spend: 0, total_revenue: 0 },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
        efficiency_filter: 'excellent',
        sort_by: 'spend',
        sort_order: 'desc',
        limit: 50,
        offset: 100,
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('group_by=imtId')
      expect(call).toContain('efficiency_filter=excellent')
      expect(call).toContain('sort_by=spend')
      expect(call).toContain('sort_order=desc')
      expect(call).toContain('limit=50')
      expect(call).toContain('offset=100')
    })

    it('combines group_by with campaign filter', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [],
        summary: { total_spend: 0, total_revenue: 0 },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
        campaign_ids: [123, 456, 789],
      })

      const call = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(call).toContain('group_by=imtId')
      expect(call).toContain('campaign_ids=123,456,789')
    })
  })

  describe('edge cases', () => {
    it('handles empty items array', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [],
        summary: {
          total_spend: 0,
          total_revenue: 0,
          roas: 0,
          roi: 0,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(result.data).toEqual([])
    })

    it('handles single merged product group', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'imtid-123456',
            imtId: 123456,
            type: 'merged_group',
            mergedProducts: [
              { nmId: 147205694, vendorCode: 'SKU-001' },
              { nmId: 147205695, vendorCode: 'SKU-002' },
              { nmId: 147205696, vendorCode: 'SKU-003' },
              { nmId: 147205697, vendorCode: 'SKU-004' },
              { nmId: 147205698, vendorCode: 'SKU-005' },
            ],
            spend: 5000,
            revenue: 25000,
          },
        ],
        summary: {
          total_spend: 5000,
          total_revenue: 25000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].mergedProducts).toHaveLength(5)
    })

    it('handles large mergedProducts array', async () => {
      const mockResponse = {
        period: { from: '2025-12-01', to: '2025-12-21' },
        items: [
          {
            key: 'imtid-999',
            imtId: 999,
            type: 'merged_group',
            mergedProducts: Array.from({ length: 20 }, (_, i) => ({
              nmId: 100000 + i,
              vendorCode: `SKU-${String(i + 1).padStart(3, '0')}`,
            })),
            spend: 20000,
            revenue: 100000,
          },
        ],
        summary: {
          total_spend: 20000,
          total_revenue: 100000,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getAdvertisingAnalytics({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'imtId',
      })

      expect(result.data[0].mergedProducts).toHaveLength(20)
      expect(result.data[0].mergedProducts![0].vendorCode).toBe('SKU-001')
      expect(result.data[0].mergedProducts![19].vendorCode).toBe('SKU-020')
    })
  })
})
