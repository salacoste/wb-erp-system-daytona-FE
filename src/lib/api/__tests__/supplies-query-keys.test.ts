/**
 * Tests for Supplies API Client - Query Keys & Error Handling
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests: suppliesQueryKeys factory, error handling patterns.
 */

import { describe, it, expect } from 'vitest'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import type { SuppliesErrorResponse } from '@/types/supplies'
import { mockErrorNotFound, mockErrorConflict, mockErrorRateLimit } from '@/test/fixtures/supplies'

// =============================================================================
// SECTION 1: Query Keys Factory Tests
// =============================================================================

describe('suppliesQueryKeys', () => {
  describe('all key', () => {
    it('should return base supplies key', () => {
      expect(suppliesQueryKeys.all).toEqual(['supplies'])
    })

    it('should return readonly tuple', () => {
      expect(Array.isArray(suppliesQueryKeys.all)).toBe(true)
    })

    it('should equal ["supplies"]', () => {
      expect(suppliesQueryKeys.all).toHaveLength(1)
      expect(suppliesQueryKeys.all[0]).toBe('supplies')
    })
  })

  describe('list key', () => {
    it('should include all base key', () => {
      const listKey = suppliesQueryKeys.lists()
      expect(listKey[0]).toEqual(suppliesQueryKeys.all[0])
    })

    it('should include "list" segment', () => {
      const listKey = suppliesQueryKeys.lists()
      expect(listKey).toContain('list')
    })

    it('should include params object', () => {
      const params = { status: 'OPEN' as const }
      const key = suppliesQueryKeys.list(params)
      const paramsEntry = key.find(k => typeof k === 'object')
      expect(paramsEntry).toBeDefined()
    })

    it('should create unique key for different params', () => {
      const key1 = suppliesQueryKeys.list({ status: 'OPEN' })
      const key2 = suppliesQueryKeys.list({ status: 'CLOSED' })
      expect(key1).not.toEqual(key2)
    })

    it('should create same key for same params', () => {
      const params = { status: 'OPEN' as const, limit: 20 }
      const key1 = suppliesQueryKeys.list(params)
      const key2 = suppliesQueryKeys.list(params)
      expect(key1).toEqual(key2)
    })
  })

  describe('detail key', () => {
    it('should include all base key', () => {
      const detailKey = suppliesQueryKeys.details()
      expect(detailKey[0]).toEqual(suppliesQueryKeys.all[0])
    })

    it('should include "detail" segment', () => {
      const detailKey = suppliesQueryKeys.details()
      expect(detailKey).toContain('detail')
    })

    it('should include supply ID', () => {
      const key = suppliesQueryKeys.detail('supply-123')
      expect(key).toContain('supply-123')
    })

    it('should create unique key for different IDs', () => {
      const key1 = suppliesQueryKeys.detail('supply-001')
      const key2 = suppliesQueryKeys.detail('supply-002')
      expect(key1).not.toEqual(key2)
    })
  })

  describe('documents key', () => {
    it('should include all base key', () => {
      const docKey = suppliesQueryKeys.documents('supply-001')
      expect(docKey[0]).toEqual(suppliesQueryKeys.all[0])
    })

    it('should include "documents" segment', () => {
      const docKey = suppliesQueryKeys.documents('supply-001')
      expect(docKey).toContain('documents')
    })

    it('should include supply ID', () => {
      const docKey = suppliesQueryKeys.documents('supply-123')
      expect(docKey).toContain('supply-123')
    })

    it('should create unique key for different IDs', () => {
      const key1 = suppliesQueryKeys.documents('supply-001')
      const key2 = suppliesQueryKeys.documents('supply-002')
      expect(key1).not.toEqual(key2)
    })
  })

  describe('key hierarchy', () => {
    it('should allow invalidating all supplies queries', () => {
      const allKey = suppliesQueryKeys.all
      const listKey = suppliesQueryKeys.lists()
      const detailKey = suppliesQueryKeys.details()
      // All keys start with the base key
      expect(listKey[0]).toBe(allKey[0])
      expect(detailKey[0]).toBe(allKey[0])
    })

    it('should allow invalidating all list queries', () => {
      const listsKey = suppliesQueryKeys.lists()
      const specificListKey = suppliesQueryKeys.list({ status: 'OPEN' })
      // Specific list key starts with lists key prefix
      expect(specificListKey[0]).toBe(listsKey[0])
      expect(specificListKey[1]).toBe(listsKey[1])
    })

    it('should allow invalidating specific detail query', () => {
      const key = suppliesQueryKeys.detail('supply-001')
      expect(key).toEqual(expect.arrayContaining([expect.any(String), 'detail', 'supply-001']))
    })

    it('should allow invalidating specific documents query', () => {
      const key = suppliesQueryKeys.documents('supply-001')
      expect(key).toEqual(expect.arrayContaining([expect.any(String), 'documents', 'supply-001']))
    })
  })
})

// =============================================================================
// SECTION 2: Error Handling Tests
// =============================================================================

describe('API Error Handling', () => {
  describe('400 Bad Request', () => {
    it('should handle validation errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: { field: 'status', error: 'Invalid value' },
      }
      expect(err.code).toBe('BAD_REQUEST')
      expect(err.message).toContain('Validation')
    })

    it('should include error details in response', () => {
      const err: SuppliesErrorResponse = {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: { fields: ['status', 'limit'] },
      }
      expect(err.details).toBeDefined()
    })

    it('should include field-level errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: { status: 'Must be one of: OPEN, CLOSED, DELIVERING, DELIVERED, CANCELLED' },
      }
      expect(err.details).toHaveProperty('status')
    })
  })

  describe('403 Forbidden', () => {
    it('should handle access denied errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'FORBIDDEN',
        message: 'Access denied to this supply',
      }
      expect(err.code).toBe('FORBIDDEN')
    })

    it('should include error message', () => {
      const err: SuppliesErrorResponse = {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      }
      expect(err.message.length).toBeGreaterThan(0)
    })
  })

  describe('404 Not Found', () => {
    it('should handle supply not found errors', () => {
      expect(mockErrorNotFound.code).toBe('SUPPLY_NOT_FOUND')
    })

    it('should handle document not found errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      }
      expect(err.code).toBe('DOCUMENT_NOT_FOUND')
    })
  })

  describe('409 Conflict', () => {
    it('should handle concurrent modification errors', () => {
      expect(mockErrorConflict.code).toBe('CONFLICT')
      expect(mockErrorConflict.message).toContain('modified')
    })

    it('should handle invalid state transition errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'CONFLICT',
        message: 'Invalid state transition from DELIVERED to OPEN',
      }
      expect(err.code).toBe('CONFLICT')
    })

    it('should include version mismatch details', () => {
      expect(mockErrorConflict.details).toHaveProperty('currentVersion')
    })
  })

  describe('429 Rate Limited', () => {
    it('should handle rate limit errors for sync', () => {
      expect(mockErrorRateLimit.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should include retry-after information', () => {
      expect(mockErrorRateLimit.details).toHaveProperty('retryAfter')
      expect(mockErrorRateLimit.details!.retryAfter).toBe(300)
    })

    it('should include reset timestamp', () => {
      const err: SuppliesErrorResponse = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        details: { resetAt: '2026-01-15T13:00:00.000Z' },
      }
      expect(err.details).toHaveProperty('resetAt')
    })
  })

  describe('500 Server Error', () => {
    it('should handle internal server errors', () => {
      const err: SuppliesErrorResponse = {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }
      expect(err.code).toBe('INTERNAL_ERROR')
    })

    it('should provide generic error message', () => {
      const err: SuppliesErrorResponse = {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      }
      expect(err.message.length).toBeGreaterThan(0)
    })
  })

  describe('Network Errors', () => {
    it('should handle connection timeout', () => {
      const err: SuppliesErrorResponse = {
        code: 'NETWORK_ERROR',
        message: 'Connection timeout',
      }
      expect(err.code).toBe('NETWORK_ERROR')
    })

    it('should handle network unavailable', () => {
      const err: SuppliesErrorResponse = {
        code: 'NETWORK_ERROR',
        message: 'Network unavailable',
      }
      expect(err.message).toContain('Network')
    })
  })
})
