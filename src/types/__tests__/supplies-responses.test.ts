/**
 * Tests for Supplies Response Types
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests validate pagination, list params, and response interfaces.
 */

import { describe, it, expect } from 'vitest'
import type {
  SuppliesPagination,
  SuppliesListParams,
  SuppliesListResponse,
  SupplyDetailResponse,
} from '@/types/supplies'
import {
  mockPagination,
  mockPaginationEmpty,
  mockListParamsDefault,
  mockListParamsFiltered,
  mockSuppliesListResponse,
  mockSuppliesListResponseEmpty,
  mockSupplyDetailResponse,
  mockSupplyDetailResponseNoRateLimit,
} from '@/test/fixtures/supplies'

// =============================================================================
// SECTION 1: SuppliesPagination Interface Tests
// =============================================================================

describe('SuppliesPagination Interface', () => {
  describe('required fields', () => {
    it('should require total as number', () => {
      const p: SuppliesPagination = mockPagination
      expect(typeof p.total).toBe('number')
      expect(p.total).toBeGreaterThanOrEqual(0)
    })

    it('should require limit as number', () => {
      const p: SuppliesPagination = mockPagination
      expect(typeof p.limit).toBe('number')
      expect(p.limit).toBeGreaterThan(0)
    })

    it('should require offset as number', () => {
      const p: SuppliesPagination = mockPagination
      expect(typeof p.offset).toBe('number')
      expect(p.offset).toBeGreaterThanOrEqual(0)
    })
  })

  describe('fixture validation', () => {
    it('should validate mockPagination structure', () => {
      expect(mockPagination).toEqual({ total: 150, limit: 20, offset: 0 })
    })

    it('should validate mockPaginationEmpty has zero total', () => {
      expect(mockPaginationEmpty.total).toBe(0)
      expect(mockPaginationEmpty.offset).toBe(0)
    })
  })
})

// =============================================================================
// SECTION 2: SuppliesListParams Interface Tests
// =============================================================================

describe('SuppliesListParams Interface', () => {
  describe('optional filter fields', () => {
    it('should allow status filter', () => {
      const params: SuppliesListParams = { status: 'OPEN' }
      expect(params.status).toBe('OPEN')
    })

    it('should allow from date filter', () => {
      const params: SuppliesListParams = { from: '2026-01-01' }
      expect(typeof params.from).toBe('string')
    })

    it('should allow to date filter', () => {
      const params: SuppliesListParams = { to: '2026-01-31' }
      expect(typeof params.to).toBe('string')
    })

    it('should allow sort_by field', () => {
      const params: SuppliesListParams = { sort_by: 'created_at' }
      expect(params.sort_by).toBe('created_at')
    })

    it('should allow sort_order field', () => {
      const params: SuppliesListParams = { sort_order: 'desc' }
      expect(params.sort_order).toBe('desc')
    })

    it('should allow limit', () => {
      const params: SuppliesListParams = { limit: 50 }
      expect(params.limit).toBe(50)
    })

    it('should allow offset', () => {
      const params: SuppliesListParams = { offset: 20 }
      expect(params.offset).toBe(20)
    })
  })

  describe('empty params', () => {
    it('should allow empty object', () => {
      const params: SuppliesListParams = {}
      expect(params.status).toBeUndefined()
      expect(params.from).toBeUndefined()
      expect(params.limit).toBeUndefined()
    })
  })

  describe('fixture validation', () => {
    it('should validate mockListParamsDefault is empty object', () => {
      expect(mockListParamsDefault).toEqual({})
      expect(Object.keys(mockListParamsDefault)).toHaveLength(0)
    })

    it('should validate mockListParamsFiltered has all filters', () => {
      expect(mockListParamsFiltered.status).toBe('OPEN')
      expect(mockListParamsFiltered.from).toBeDefined()
      expect(mockListParamsFiltered.to).toBeDefined()
      expect(mockListParamsFiltered.limit).toBe(50)
      expect(mockListParamsFiltered.offset).toBe(0)
    })
  })
})

// =============================================================================
// SECTION 3: SuppliesListResponse Interface Tests
// =============================================================================

describe('SuppliesListResponse Interface', () => {
  describe('required fields', () => {
    it('should require items array', () => {
      expect(Array.isArray(mockSuppliesListResponse.items)).toBe(true)
    })

    it('should require pagination object', () => {
      expect(mockSuppliesListResponse.pagination).toBeDefined()
      expect(typeof mockSuppliesListResponse.pagination.total).toBe('number')
    })

    it('should require filters object', () => {
      expect(mockSuppliesListResponse.filters).toBeDefined()
      expect(typeof mockSuppliesListResponse.filters).toBe('object')
    })
  })

  describe('filters object structure', () => {
    it('should have status filter (nullable)', () => {
      const val = mockSuppliesListResponse.filters.status
      expect(val === null || typeof val === 'string').toBe(true)
    })

    it('should have from filter (nullable)', () => {
      const val = mockSuppliesListResponse.filters.from
      expect(val === null || typeof val === 'string').toBe(true)
    })

    it('should have to filter (nullable)', () => {
      const val = mockSuppliesListResponse.filters.to
      expect(val === null || typeof val === 'string').toBe(true)
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSuppliesListResponse structure', () => {
      const res: SuppliesListResponse = mockSuppliesListResponse
      expect(res.items.length).toBeGreaterThan(0)
      expect(res.pagination.total).toBeGreaterThan(0)
    })

    it('should validate mockSuppliesListResponseEmpty has empty items', () => {
      expect(mockSuppliesListResponseEmpty.items).toHaveLength(0)
      expect(mockSuppliesListResponseEmpty.pagination.total).toBe(0)
    })
  })
})

// =============================================================================
// SECTION 4: SupplyDetailResponse Interface Tests
// =============================================================================

describe('SupplyDetailResponse Interface', () => {
  describe('extends Supply', () => {
    it('should have all Supply fields', () => {
      const res: SupplyDetailResponse = mockSupplyDetailResponse
      expect(res.id).toBeDefined()
      expect(res.status).toBeDefined()
      expect(res.ordersCount).toBeDefined()
      expect(res.createdAt).toBeDefined()
      expect(res.orders).toBeDefined()
      expect(res.documents).toBeDefined()
    })
  })

  describe('optional rate limit info', () => {
    it('should allow syncRateLimit to be undefined', () => {
      const res: SupplyDetailResponse = mockSupplyDetailResponseNoRateLimit
      expect(res.syncRateLimit).toBeUndefined()
    })

    it('should validate syncRateLimit structure when present', () => {
      expect(mockSupplyDetailResponse.syncRateLimit).toBeDefined()
      expect(typeof mockSupplyDetailResponse.syncRateLimit).toBe('object')
    })

    it('should have remaining count in syncRateLimit', () => {
      expect(mockSupplyDetailResponse.syncRateLimit!.remaining).toBe(5)
      expect(typeof mockSupplyDetailResponse.syncRateLimit!.remaining).toBe('number')
    })

    it('should have resetAt timestamp in syncRateLimit', () => {
      expect(typeof mockSupplyDetailResponse.syncRateLimit!.resetAt).toBe('string')
      expect(mockSupplyDetailResponse.syncRateLimit!.resetAt.length).toBeGreaterThan(0)
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSupplyDetailResponse has rate limit', () => {
      expect(mockSupplyDetailResponse.syncRateLimit).toBeDefined()
      expect(mockSupplyDetailResponse.syncRateLimit!.remaining).toBeGreaterThanOrEqual(0)
    })

    it('should validate mockSupplyDetailResponseNoRateLimit has no rate limit', () => {
      expect(mockSupplyDetailResponseNoRateLimit.syncRateLimit).toBeUndefined()
    })
  })
})
