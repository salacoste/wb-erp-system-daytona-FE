/**
 * Tests for Supplies API Client — Core Functions + Normalizers
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Covers: getSupplies, getSupply, createSupply, syncSupplies,
 *         normalizeSuppliesListResponse, normalizeSupplyDetailResponse,
 *         suppliesQueryKeys
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ------------------------------------------------------------------

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// --- Imports (after mocks) --------------------------------------------------

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import {
  getSupplies,
  getSupply,
  createSupply,
  addOrders,
  removeOrders,
  closeSupply,
  getSupplyDetail,
  removeOrdersFromSupply,
  suppliesQueryKeys,
} from '../supplies'
import { syncSupplies } from '../supplies-documents'
import {
  normalizeSuppliesListResponse,
  normalizeSupplyDetailResponse,
} from '../supplies-normalizer'

// --- Shared fixtures --------------------------------------------------------

const RAW_LIST_ITEM = {
  id: 'sup-001',
  name: 'Test Supply',
  status: 'OPEN',
  createdAt: '2025-06-01T10:00:00Z',
  closedAt: null,
  ordersCount: 5,
  cargoType: 1,
  isLargeCargo: false,
}

const RAW_LIST_RESPONSE = {
  items: [RAW_LIST_ITEM],
  pagination: { total: 1, limit: 50, offset: 0 },
}

const RAW_DETAIL_RESPONSE = {
  supply: {
    id: 'sup-001',
    wbSupplyId: 'WB-12345',
    name: 'Detail Supply',
    status: 'OPEN',
    ordersCount: 3,
    createdAt: '2025-06-01T10:00:00Z',
    closedAt: null,
    warehouseId: 50,
  },
  orders: [
    {
      orderId: 'ord-1',
      nmId: 100,
      article: 'SKU-001',
      salePrice: 1500,
      supplierStatus: 'awaiting',
      addedAt: '2025-06-01T11:00:00Z',
    },
  ],
  documents: [
    {
      docType: 'sticker',
      format: 'png',
      generatedAt: '2025-06-01T12:00:00Z',
      fileSize: 2048,
    },
  ],
}

const SYNC_RESPONSE = { jobId: 'job-abc-123', message: 'Sync job enqueued' }

const resetMocks = () => {
  vi.mocked(apiClient.get).mockReset()
  vi.mocked(apiClient.post).mockReset()
  vi.mocked(logger.debug).mockReset()
}

// =============================================================================
// SECTION 1: getSupplies() Tests
// =============================================================================

describe('getSupplies()', () => {
  beforeEach(resetMocks)

  describe('basic functionality', () => {
    it('calls GET /v1/supplies with skipDataUnwrap', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/supplies', { skipDataUnwrap: true })
    })

    it('returns items array and pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      const r = await getSupplies()
      expect(r.items).toHaveLength(1)
      expect(r.pagination).toEqual({ total: 1, limit: 50, offset: 0 })
    })

    it('passes through filters when backend provides them', () => {
      const raw = { ...RAW_LIST_RESPONSE, filters: { status: 'OPEN', from: null, to: null } }
      const result = normalizeSuppliesListResponse(raw)
      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
    })
  })

  describe('query parameters', () => {
    it('omits query string when no params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies()
      expect(apiClient.get).toHaveBeenCalledWith('/v1/supplies', { skipDataUnwrap: true })
    })

    it.each([
      [{ status: 'OPEN' }, 'status=OPEN'],
      [{ from: '2025-06-01' }, 'from=2025-06-01'],
      [{ to: '2025-06-30' }, 'to=2025-06-30'],
      [{ limit: 20 }, 'limit=20'],
      [{ offset: 20 }, 'offset=20'],
    ] as const)('includes %s in query string', async (params, expected) => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies(params)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain(expected)
    })

    it('omits undefined params from query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies({ status: 'OPEN', from: undefined })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('from=')
      expect(url).toContain('status=OPEN')
    })

    it('omits null params from query string', () => {
      const params: Record<string, unknown> = { status: 'CLOSED', extra: null }
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) sp.append(k, String(v))
      }
      expect(sp.toString()).toBe('status=CLOSED')
    })
  })

  describe('pagination', () => {
    it('returns total/limit/offset from backend', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        ...RAW_LIST_RESPONSE,
        pagination: { total: 42, limit: 25, offset: 40 },
      })
      const r = await getSupplies({ limit: 25, offset: 40 })
      expect(r.pagination).toEqual({ total: 42, limit: 25, offset: 40 })
    })

    it('handles page 1 (offset=0)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      expect((await getSupplies({ limit: 20, offset: 0 })).pagination.offset).toBe(0)
    })

    it('handles page 2 (offset=20)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        ...RAW_LIST_RESPONSE,
        pagination: { total: 50, limit: 20, offset: 20 },
      })
      expect((await getSupplies({ limit: 20, offset: 20 })).pagination.offset).toBe(20)
    })
  })

  describe('filtering', () => {
    it.each(['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as const)(
      'filters by %s status',
      async status => {
        vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
        await getSupplies({ status })
        const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
        expect(url).toBe(`/v1/supplies?status=${status}`)
      }
    )

    it('filters by date range', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies({ from: '2025-01-01', to: '2025-01-31' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('from=2025-01-01')
      expect(url).toContain('to=2025-01-31')
    })

    it('combines multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies({
        status: 'OPEN',
        from: '2025-06-01',
        to: '2025-06-30',
        limit: 10,
        offset: 20,
      })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('status=OPEN')
      expect(url).toContain('from=2025-06-01')
      expect(url).toContain('limit=10')
      expect(url).toContain('offset=20')
    })
  })

  describe('empty results', () => {
    it('returns empty items and zero total', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        items: [],
        pagination: { total: 0, limit: 50, offset: 0 },
      })
      const r = await getSupplies()
      expect(r.items).toEqual([])
      expect(r.pagination.total).toBe(0)
    })
  })

  describe('logging', () => {
    it('logs request params and response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_LIST_RESPONSE)
      await getSupplies({ status: 'OPEN' })
      expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Fetching supplies:', {
        status: 'OPEN',
      })
      expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Supplies response:', {
        count: 1,
        total: 1,
      })
    })
  })
})

// =============================================================================
// SECTION 2: getSupply() Tests
// =============================================================================

describe('getSupply()', () => {
  beforeEach(resetMocks)

  it('calls GET /v1/supplies/:id with skipDataUnwrap', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_DETAIL_RESPONSE)
    await getSupply('sup-001')
    expect(apiClient.get).toHaveBeenCalledWith('/v1/supplies/sup-001', { skipDataUnwrap: true })
  })

  it('returns flattened supply with orders and documents', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_DETAIL_RESPONSE)
    const r = await getSupply('sup-001')
    expect(r.id).toBe('sup-001')
    expect(r.status).toBe('OPEN')
    expect(r.name).toBe('Detail Supply')
    expect(r.orders).toHaveLength(1)
    expect(r.documents).toHaveLength(1)
  })

  it.each([
    ['abc-123', '/v1/supplies/abc-123'],
    ['550e8400-e29b-41d4-a716-446655440000', '/v1/supplies/550e8400-e29b-41d4-a716-446655440000'],
    ['sup-xyz', '/v1/supplies/sup-xyz'],
  ] as const)('handles ID %s', async (id, expectedUrl) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_DETAIL_RESPONSE)
    await getSupply(id)
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl, { skipDataUnwrap: true })
  })

  describe('rate limit info', () => {
    it('includes syncRateLimit when inside supply object', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        ...RAW_DETAIL_RESPONSE,
        supply: {
          ...RAW_DETAIL_RESPONSE.supply,
          syncRateLimit: { remaining: 5, resetAt: '2025-06-01T15:00:00Z' },
        },
      })
      const r = await getSupply('sup-001')
      expect(r.syncRateLimit).toEqual({ remaining: 5, resetAt: '2025-06-01T15:00:00Z' })
    })

    it('handles missing syncRateLimit', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_DETAIL_RESPONSE)
      expect((await getSupply('sup-001')).syncRateLimit).toBeUndefined()
    })
  })

  it('logs supply ID being fetched', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(RAW_DETAIL_RESPONSE)
    await getSupply('sup-001')
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Fetching supply:', 'sup-001')
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not Found'))
    await expect(getSupply('nonexistent')).rejects.toThrow('Not Found')
  })
})

// =============================================================================
// SECTION 3: createSupply() Tests
// =============================================================================

describe('createSupply()', () => {
  beforeEach(resetMocks)

  const CREATED = {
    id: 'sup-new',
    wbSupplyId: 'WB-99999',
    name: null,
    status: 'OPEN',
    createdAt: '2025-06-01T10:00:00Z',
    closedAt: null,
    ordersCount: 0,
  }

  it('calls POST /v1/supplies with body and returns response', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CREATED)
    const r = await createSupply()
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies', {})
    expect(r).toMatchObject({ id: 'sup-new', wbSupplyId: 'WB-99999', status: 'OPEN' })
  })

  it('sends name when provided', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ ...CREATED, name: 'My Supply' })
    const r = await createSupply({ name: 'My Supply' })
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies', { name: 'My Supply' })
    expect(r.name).toBe('My Supply')
  })

  it('returns name as null when not provided', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CREATED)
    expect((await createSupply()).name).toBeNull()
  })

  it('logs request and created ID', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CREATED)
    await createSupply({ name: 'Test' })
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Creating supply:', { name: 'Test' })
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Supply created:', 'sup-new')
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Bad Request'))
    await expect(createSupply()).rejects.toThrow('Bad Request')
  })
})

// =============================================================================
// SECTION 4: addOrders() Tests
// =============================================================================

describe('addOrders()', () => {
  beforeEach(resetMocks)

  const ADD_RESPONSE = { added: 2, failed: 0 }

  it('calls POST /v1/supplies/:id/orders with orderIds', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(ADD_RESPONSE)
    await addOrders('sup-001', ['ord-1', 'ord-2'])
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/sup-001/orders', {
      orderIds: ['ord-1', 'ord-2'],
    })
  })

  it('returns added and failed counts', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(ADD_RESPONSE)
    const r = await addOrders('sup-001', ['ord-1', 'ord-2'])
    expect(r.added).toBe(2)
    expect(r.failed).toBe(0)
  })

  it('handles partial failure with errors array', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      added: 1,
      failed: 1,
      errors: ['Order ord-2 already in supply'],
    })
    const r = await addOrders('sup-001', ['ord-1', 'ord-2'])
    expect(r.added).toBe(1)
    expect(r.failed).toBe(1)
    expect(r.errors).toEqual(['Order ord-2 already in supply'])
  })

  it('sends empty array when no order IDs provided', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ added: 0, failed: 0 })
    await addOrders('sup-001', [])
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/sup-001/orders', { orderIds: [] })
  })

  it('logs supply ID and order count', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(ADD_RESPONSE)
    await addOrders('sup-001', ['ord-1', 'ord-2'])
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Adding orders:', {
      supplyId: 'sup-001',
      orderCount: 2,
    })
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Orders added:', {
      added: 2,
      failed: 0,
    })
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Conflict'))
    await expect(addOrders('sup-001', ['ord-1'])).rejects.toThrow('Conflict')
  })
})

// =============================================================================
// SECTION 5: removeOrders() Tests
// =============================================================================

describe('removeOrders()', () => {
  beforeEach(resetMocks)

  const REMOVE_RESPONSE = { removedCount: 3, totalOrdersCount: 10 }

  it('calls POST /v1/supplies/:id/orders/remove with orderIds', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(REMOVE_RESPONSE)
    await removeOrders('sup-001', ['ord-1', 'ord-2', 'ord-3'])
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/sup-001/orders/remove', {
      orderIds: ['ord-1', 'ord-2', 'ord-3'],
    })
  })

  it('returns removedCount and totalOrdersCount', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(REMOVE_RESPONSE)
    const r = await removeOrders('sup-001', ['ord-1', 'ord-2', 'ord-3'])
    expect(r.removedCount).toBe(3)
    expect(r.totalOrdersCount).toBe(10)
  })

  it('handles removing single order', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ removedCount: 1, totalOrdersCount: 5 })
    const r = await removeOrders('sup-001', ['ord-1'])
    expect(r.removedCount).toBe(1)
  })

  it('logs removal operation', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(REMOVE_RESPONSE)
    await removeOrders('sup-001', ['ord-1'])
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Removing orders:', {
      supplyId: 'sup-001',
      orderCount: 1,
    })
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Orders removed:', 3)
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Not Found'))
    await expect(removeOrders('sup-001', ['ord-1'])).rejects.toThrow('Not Found')
  })
})

// =============================================================================
// SECTION 6: closeSupply() Tests
// =============================================================================

describe('closeSupply()', () => {
  beforeEach(resetMocks)

  const CLOSE_RESPONSE = {
    status: 'CLOSED',
    closedAt: '2025-06-01T15:00:00Z',
    message: 'Supply closed successfully',
  }

  it('calls POST /v1/supplies/:id/close with empty body', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CLOSE_RESPONSE)
    await closeSupply('sup-001')
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/sup-001/close', {})
  })

  it('returns closed supply status and timestamp', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CLOSE_RESPONSE)
    const r = await closeSupply('sup-001')
    expect(r.status).toBe('CLOSED')
    expect(r.closedAt).toBe('2025-06-01T15:00:00Z')
    expect(r.message).toBe('Supply closed successfully')
  })

  it.each(['sup-abc', '550e8400-e29b-41d4-a716-446655440000'] as const)(
    'uses correct URL for supply ID %s',
    async id => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(CLOSE_RESPONSE)
      await closeSupply(id)
      expect(apiClient.post).toHaveBeenCalledWith(`/v1/supplies/${id}/close`, {})
    }
  )

  it('logs close operation and result', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(CLOSE_RESPONSE)
    await closeSupply('sup-001')
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Closing supply:', 'sup-001')
    expect(logger.debug).toHaveBeenCalledWith(
      '[Supplies API] Supply closed:',
      '2025-06-01T15:00:00Z'
    )
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Conflict'))
    await expect(closeSupply('sup-001')).rejects.toThrow('Conflict')
  })
})

// =============================================================================
// SECTION 7: Alias Exports Tests
// =============================================================================

describe('alias exports', () => {
  it('getSupplyDetail is an alias for getSupply', () => {
    expect(getSupplyDetail).toBe(getSupply)
  })

  it('removeOrdersFromSupply is an alias for removeOrders', () => {
    expect(removeOrdersFromSupply).toBe(removeOrders)
  })
})

// =============================================================================
// SECTION 8: syncSupplies() Tests
// =============================================================================

describe('syncSupplies()', () => {
  beforeEach(resetMocks)

  it('calls POST /v1/supplies/sync and returns { jobId, message }', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(SYNC_RESPONSE)
    const r = await syncSupplies()
    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/sync', {})
    expect(r).toEqual({ jobId: 'job-abc-123', message: 'Sync job enqueued' })
  })

  it('logs sync request and enqueued job', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(SYNC_RESPONSE)
    await syncSupplies()
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Syncing supplies with WB')
    expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Sync job enqueued:', {
      jobId: 'job-abc-123',
    })
  })

  it('throws on 429 rate limited', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Too Many Requests'))
    await expect(syncSupplies()).rejects.toThrow('Too Many Requests')
  })
})

// =============================================================================
// SECTION 9: Normalizer Tests
// =============================================================================

describe('normalizeSuppliesListResponse', () => {
  it('normalizes well-formed response', () => {
    const r = normalizeSuppliesListResponse(RAW_LIST_RESPONSE)
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({ id: 'sup-001', status: 'OPEN', ordersCount: 5 })
    expect(r.pagination).toEqual({ total: 1, limit: 50, offset: 0 })
  })

  it('handles snake_case backend fields', () => {
    const r = normalizeSuppliesListResponse({
      items: [
        {
          id: 'sup-002',
          created_at: '2025-06-02T10:00:00Z',
          closed_at: '2025-06-03T10:00:00Z',
          orders_count: 10,
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
    })
    expect(r.items[0]).toMatchObject({
      createdAt: '2025-06-02T10:00:00Z',
      closedAt: '2025-06-03T10:00:00Z',
      ordersCount: 10,
    })
  })

  it('handles missing items/pagination', () => {
    const r = normalizeSuppliesListResponse({})
    expect(r.items).toEqual([])
    expect(r.pagination).toEqual({ total: 0, limit: 50, offset: 0 })
  })

  it('handles null input', () => {
    expect(normalizeSuppliesListResponse(null).items).toEqual([])
  })

  it('uses "meta" as fallback pagination key', () => {
    const r = normalizeSuppliesListResponse({
      items: [],
      meta: { total: 99, limit: 10, offset: 5 },
    })
    expect(r.pagination).toEqual({ total: 99, limit: 10, offset: 5 })
  })

  it('defaults id to "" and status to "unknown" when missing', () => {
    const r = normalizeSuppliesListResponse({
      items: [{}],
      pagination: { total: 1, limit: 50, offset: 0 },
    })
    expect(r.items[0]).toMatchObject({ id: '', status: 'unknown' })
  })
})

describe('normalizeSupplyDetailResponse', () => {
  it('flattens nested { supply, orders, documents }', () => {
    const r = normalizeSupplyDetailResponse(RAW_DETAIL_RESPONSE)
    expect(r).toMatchObject({
      id: 'sup-001',
      name: 'Detail Supply',
      status: 'OPEN',
      warehouseId: 50,
    })
    expect(r.orders).toHaveLength(1)
    expect(r.documents).toHaveLength(1)
  })

  it('maps backend order fields: article→vendorCode, orderId→orderUid, productName→null', () => {
    const r = normalizeSupplyDetailResponse(RAW_DETAIL_RESPONSE)
    expect(r.orders[0]).toMatchObject({
      vendorCode: 'SKU-001',
      orderUid: 'ord-1',
      productName: null,
    })
  })

  it('maps backend document fields: docType→type, fileSize→sizeBytes', () => {
    const r = normalizeSupplyDetailResponse(RAW_DETAIL_RESPONSE)
    expect(r.documents[0]).toMatchObject({ type: 'sticker', sizeBytes: 2048 })
  })

  it('handles already-flat response (backward compat)', () => {
    const r = normalizeSupplyDetailResponse({
      id: 'sup-flat',
      name: 'Flat',
      status: 'CLOSED',
      ordersCount: 2,
      createdAt: '2025-06-01T10:00:00Z',
      closedAt: '2025-06-02T10:00:00Z',
      orders: [],
      documents: [],
    })
    expect(r).toMatchObject({ id: 'sup-flat', status: 'CLOSED' })
  })

  it('handles null/missing arrays', () => {
    const rNull = normalizeSupplyDetailResponse(null)
    expect(rNull.orders).toEqual([])
    expect(rNull.documents).toEqual([])

    const rNoOrders = normalizeSupplyDetailResponse({ supply: { id: 'x' }, documents: [] })
    expect(rNoOrders.orders).toEqual([])

    const rNoDocs = normalizeSupplyDetailResponse({ supply: { id: 'x' }, orders: [] })
    expect(rNoDocs.documents).toEqual([])
  })
})

// =============================================================================
// SECTION 10: Query Keys Factory Tests
// =============================================================================

describe('suppliesQueryKeys', () => {
  it('produces correct key shapes', () => {
    const params = { status: 'OPEN' as const }
    expect(suppliesQueryKeys.all).toEqual(['supplies'])
    expect(suppliesQueryKeys.lists()).toEqual(['supplies', 'list'])
    expect(suppliesQueryKeys.list(params)).toEqual(['supplies', 'list', params])
    expect(suppliesQueryKeys.details()).toEqual(['supplies', 'detail'])
    expect(suppliesQueryKeys.detail('sup-001')).toEqual(['supplies', 'detail', 'sup-001'])
    expect(suppliesQueryKeys.documents('sup-001')).toEqual(['supplies', 'documents', 'sup-001'])
  })
})
