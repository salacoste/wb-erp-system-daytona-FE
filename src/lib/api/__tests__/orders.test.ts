/**
 * TDD Tests for Orders API Client - Core Functions
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests: getOrders, getOrderById, triggerOrdersSync, getOrdersSyncStatus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getOrders,
  getOrderById,
  triggerOrdersSync,
  getOrdersSyncStatus,
  updateOrderOperationalStatus,
} from '../orders'

vi.spyOn(console, 'info').mockImplementation(() => {})

// Fixtures
const mockOrderItem = {
  orderId: '1234567890',
  orderUid: 'order-uid-abc123',
  nmId: 12345678,
  vendorCode: 'SKU-ABC-001',
  productName: 'Test Product',
  price: 1500.0,
  salePrice: 1200.0,
  supplierStatus: 'new' as const,
  wbStatus: 'waiting' as const,
  warehouseId: 507,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: 'MGT',
  createdAt: '2026-01-04T10:30:00.000Z',
  statusUpdatedAt: '2026-01-04T11:00:00.000Z',
}

const mockOrdersListResponse = {
  items: [mockOrderItem],
  pagination: { total: 150, limit: 100, offset: 0 },
  query: { from: null, to: null },
}

const mockOrderDetails = {
  ...mockOrderItem,
  supplierStatus: 'confirm' as const,
  wbStatus: 'sorted' as const,
  chrtId: 987654321,
  address: { fullAddress: 'г. Москва', longitude: 37.6176, latitude: 55.7558 },
  statusHistory: [
    {
      supplierStatus: 'new' as const,
      wbStatus: 'waiting' as const,
      changedAt: '2026-01-04T10:30:00.000Z',
    },
  ],
  processingTimeSeconds: 5400,
  syncedAt: '2026-01-04T12:05:00.000Z',
}

describe('Orders API Client - Core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrders', () => {
    it('calls API with correct endpoint without params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      await getOrders()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders', { skipDataUnwrap: true })
    })

    it('includes date range filters in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      await getOrders({ from: '2026-01-01', to: '2026-01-07' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('from=2026-01-01')
      expect(url).toContain('to=2026-01-07')
    })

    it('includes status filters in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      await getOrders({ supplier_status: 'new', wb_status: 'waiting' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('supplier_status=new')
      expect(url).toContain('wb_status=waiting')
    })

    it('includes sorting and pagination params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      await getOrders({ sort_by: 'created_at', sort_order: 'desc', limit: 50, offset: 100 })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('sort_by=created_at')
      expect(url).toContain('limit=50')
      expect(url).toContain('offset=100')
    })

    it('omits undefined params from query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      await getOrders({ from: '2026-01-01', to: undefined })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('from=2026-01-01')
      expect(url).not.toContain('to=')
    })

    it('returns response with items and pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersListResponse)
      const result = await getOrders()
      expect(result.items).toHaveLength(1)
      expect(result.pagination.total).toBe(150)
    })
  })

  describe('getOrderById', () => {
    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrderDetails)
      await getOrderById('1234567890')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders/1234567890')
    })

    it('returns order details with extended fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrderDetails)
      const result = await getOrderById('1234567890')
      expect(result.chrtId).toBe(987654321)
      expect(result.address).toBeDefined()
      expect(result.processingTimeSeconds).toBe(5400)
    })
  })

  describe('triggerOrdersSync', () => {
    it('calls POST to /v1/orders/sync', async () => {
      const mockResponse = { jobId: 'sync-job-123', message: 'Orders sync job enqueued' }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
      const result = await triggerOrdersSync()
      expect(apiClient.post).toHaveBeenCalledWith('/v1/orders/sync', {})
      expect(result.jobId).toContain('sync-job')
    })
  })

  describe('getOrdersSyncStatus', () => {
    it('calls GET to /v1/orders/sync-status', async () => {
      const mockStatus = {
        enabled: true,
        lastSyncAt: '2026-01-04T10:00:00.000Z',
        nextSyncAt: '2026-01-04T10:05:00.000Z',
        schedule: 'Every 5 minutes',
        timezone: 'Europe/Moscow',
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockStatus)
      const result = await getOrdersSyncStatus()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders/sync-status')
      expect(result.enabled).toBe(true)
      expect(result.timezone).toBe('Europe/Moscow')
    })
  })

  // --- Story O1: operational status ---

  describe('updateOrderOperationalStatus', () => {
    it('PATCHes /v1/orders/:uuid/operational-status with {status}', async () => {
      const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
      const mockResponse = {
        id: uuid,
        operationalStatus: 'ASSEMBLED',
        operationalStatusUpdatedAt: '2026-07-04T12:00:00Z',
      }
      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse)
      const result = await updateOrderOperationalStatus(uuid, 'ASSEMBLED')
      expect(apiClient.patch).toHaveBeenCalledWith(`/v1/orders/${uuid}/operational-status`, {
        status: 'ASSEMBLED',
      })
      expect(result.id).toBe(uuid)
      expect(result.operationalStatus).toBe('ASSEMBLED')
      expect(result.operationalStatusUpdatedAt).toBe('2026-07-04T12:00:00Z')
    })

    it('uses the UUID (not the WB orderId) in the URL', async () => {
      const uuid = '11111111-2222-3333-4444-555555555555'
      vi.mocked(apiClient.patch).mockResolvedValue({
        id: uuid,
        operationalStatus: 'CANCELLED',
        operationalStatusUpdatedAt: null,
      })
      await updateOrderOperationalStatus(uuid, 'CANCELLED')
      const url = vi.mocked(apiClient.patch).mock.calls[0][0]
      expect(url).toBe(`/v1/orders/${uuid}/operational-status`)
    })
  })
})
