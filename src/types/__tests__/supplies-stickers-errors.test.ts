/**
 * Tests for Supplies Stickers & Error Types
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests: GenerateStickers, SyncSupplies, Error response interfaces.
 */

import { describe, it, expect } from 'vitest'
import type { StickerFormat, SuppliesErrorResponse, SyncSuppliesResponse } from '@/types/supplies'
import {
  mockGenerateStickersRequestPng,
  mockGenerateStickersRequestSvg,
  mockGenerateStickersRequestZpl,
  mockGenerateStickersResponsePng,
  mockGenerateStickersResponseSvg,
  mockGenerateStickersResponseZpl,
} from '@/test/fixtures/supplies-responses'
import {
  mockSyncSuppliesResponse,
  mockSyncSuppliesResponseNoChanges,
  mockErrorNotFound,
  mockErrorConflict,
  mockErrorRateLimit,
  mockErrorForbidden,
} from '@/test/fixtures/supplies'

// =============================================================================
// SECTION 1: GenerateStickersRequest/Response Tests
// =============================================================================

describe('GenerateStickersRequest Interface', () => {
  describe('required fields', () => {
    it('should require format as StickerFormat', () => {
      const req = mockGenerateStickersRequestPng
      expect(req.format).toBeDefined()
      expect(typeof req.format).toBe('string')
    })
  })

  describe('format values', () => {
    it('should accept png format', () => {
      const fmt: StickerFormat = 'png'
      expect(fmt).toBe('png')
      expect(mockGenerateStickersRequestPng.format).toBe('png')
    })

    it('should accept svg format', () => {
      const fmt: StickerFormat = 'svg'
      expect(fmt).toBe('svg')
      expect(mockGenerateStickersRequestSvg.format).toBe('svg')
    })

    it('should accept zpl format', () => {
      const fmt: StickerFormat = 'zpl'
      expect(fmt).toBe('zpl')
      expect(mockGenerateStickersRequestZpl.format).toBe('zpl')
    })
  })

  describe('fixture validation', () => {
    it('should validate mockGenerateStickersRequestPng', () => {
      expect(mockGenerateStickersRequestPng).toEqual({ format: 'png' })
    })

    it('should validate mockGenerateStickersRequestSvg', () => {
      expect(mockGenerateStickersRequestSvg).toEqual({ format: 'svg' })
    })

    it('should validate mockGenerateStickersRequestZpl', () => {
      expect(mockGenerateStickersRequestZpl).toEqual({ format: 'zpl' })
    })
  })
})

describe('GenerateStickersResponse Interface', () => {
  describe('required fields', () => {
    it('should require document as SupplyDocument', () => {
      const res = mockGenerateStickersResponsePng
      expect(res.document).toBeDefined()
      expect(typeof res.document.type).toBe('string')
      expect(typeof res.document.format).toBe('string')
      expect(typeof res.document.generatedAt).toBe('string')
      expect(typeof res.document.downloadUrl).toBe('string')
    })

    it('should require message as string', () => {
      const res = mockGenerateStickersResponsePng
      expect(typeof res.message).toBe('string')
      expect(res.message.length).toBeGreaterThan(0)
    })
  })

  describe('optional data field', () => {
    it('should allow data as optional string (base64)', () => {
      const res: { data?: string } = mockGenerateStickersResponsePng
      expect(res.data === undefined || typeof res.data === 'string').toBe(true)
    })

    it('should have data for PNG format', () => {
      expect(mockGenerateStickersResponsePng.data).toBeDefined()
      expect(typeof mockGenerateStickersResponsePng.data).toBe('string')
    })

    it('should have data for SVG format', () => {
      expect(mockGenerateStickersResponseSvg.data).toBeDefined()
      expect(typeof mockGenerateStickersResponseSvg.data).toBe('string')
    })

    it('should not have data for ZPL format', () => {
      expect(mockGenerateStickersResponseZpl.data).toBeUndefined()
    })
  })

  describe('fixture validation', () => {
    it('should validate mockGenerateStickersResponsePng has data', () => {
      expect(mockGenerateStickersResponsePng.data).toBeTruthy()
      expect(mockGenerateStickersResponsePng.document.format).toBe('png')
    })

    it('should validate mockGenerateStickersResponseSvg has data', () => {
      expect(mockGenerateStickersResponseSvg.data).toBeTruthy()
      expect(mockGenerateStickersResponseSvg.document.format).toBe('svg')
    })

    it('should validate mockGenerateStickersResponseZpl has no data', () => {
      expect(mockGenerateStickersResponseZpl.data).toBeUndefined()
      expect(mockGenerateStickersResponseZpl.document.format).toBe('zpl')
    })
  })
})

// =============================================================================
// SECTION 2: SyncSuppliesResponse Tests
// =============================================================================

describe('SyncSuppliesResponse Interface', () => {
  describe('required fields', () => {
    it('should require jobId as string', () => {
      expect(typeof mockSyncSuppliesResponse.jobId).toBe('string')
      expect(mockSyncSuppliesResponse.jobId.length).toBeGreaterThan(0)
    })

    it('should require message as string', () => {
      expect(typeof mockSyncSuppliesResponse.message).toBe('string')
      expect(mockSyncSuppliesResponse.message.length).toBeGreaterThan(0)
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSyncSuppliesResponse with changes', () => {
      expect(mockSyncSuppliesResponse).toBeDefined()
      expect(mockSyncSuppliesResponse.jobId).toBe('sync-job-001')
      expect(mockSyncSuppliesResponse.message).toBeTruthy()
    })

    it('should validate mockSyncSuppliesResponseNoChanges', () => {
      expect(mockSyncSuppliesResponseNoChanges).toBeDefined()
      expect(mockSyncSuppliesResponseNoChanges.jobId).toBe('sync-job-002')
      expect(mockSyncSuppliesResponseNoChanges.message).toBeTruthy()
    })

    it('should validate sync response shape', () => {
      const res: SyncSuppliesResponse = mockSyncSuppliesResponse
      expect(res).toHaveProperty('jobId')
      expect(res).toHaveProperty('message')
    })
  })
})

// =============================================================================
// SECTION 3: SuppliesErrorResponse Tests
// =============================================================================

describe('SuppliesErrorResponse Interface', () => {
  describe('required fields', () => {
    it('should require code as string', () => {
      expect(typeof mockErrorNotFound.code).toBe('string')
      expect(mockErrorNotFound.code).toBe('SUPPLY_NOT_FOUND')
    })

    it('should require message as string', () => {
      expect(typeof mockErrorNotFound.message).toBe('string')
      expect(mockErrorNotFound.message.length).toBeGreaterThan(0)
    })
  })

  describe('optional details field', () => {
    it('should allow details as optional Record', () => {
      const err: SuppliesErrorResponse = mockErrorConflict
      expect(err.details).toBeDefined()
      expect(typeof err.details).toBe('object')
    })

    it('should allow details to be undefined', () => {
      const err: SuppliesErrorResponse = mockErrorNotFound
      expect(err.details).toBeUndefined()
    })
  })

  describe('error code patterns', () => {
    it('should validate SUPPLY_NOT_FOUND error code', () => {
      expect(mockErrorNotFound.code).toBe('SUPPLY_NOT_FOUND')
    })

    it('should validate FORBIDDEN error code', () => {
      expect(mockErrorForbidden.code).toBe('FORBIDDEN')
    })

    it('should validate BAD_REQUEST error code', () => {
      // Using a constructed object since no BAD_REQUEST fixture
      const err: SuppliesErrorResponse = { code: 'BAD_REQUEST', message: 'Invalid input' }
      expect(err.code).toBe('BAD_REQUEST')
    })

    it('should validate CONFLICT error code', () => {
      expect(mockErrorConflict.code).toBe('CONFLICT')
    })

    it('should validate RATE_LIMIT_EXCEEDED error code', () => {
      expect(mockErrorRateLimit.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should validate SUPPLY_NOT_MODIFIABLE error code', () => {
      const err: SuppliesErrorResponse = {
        code: 'SUPPLY_NOT_MODIFIABLE',
        message: 'Supply cannot be modified',
      }
      expect(err.code).toBe('SUPPLY_NOT_MODIFIABLE')
    })

    it('should validate SUPPLY_EMPTY error code', () => {
      const err: SuppliesErrorResponse = {
        code: 'SUPPLY_EMPTY',
        message: 'Supply has no orders',
      }
      expect(err.code).toBe('SUPPLY_EMPTY')
    })

    it('should validate MAX_ORDERS_EXCEEDED error code', () => {
      const err: SuppliesErrorResponse = {
        code: 'MAX_ORDERS_EXCEEDED',
        message: 'Exceeds max orders per supply',
      }
      expect(err.code).toBe('MAX_ORDERS_EXCEEDED')
    })
  })

  describe('fixture validation', () => {
    it('should validate mockErrorNotFound structure', () => {
      expect(mockErrorNotFound).toEqual({
        code: 'SUPPLY_NOT_FOUND',
        message: 'Supply not found',
      })
    })

    it('should validate mockErrorConflict has details', () => {
      expect(mockErrorConflict.details).toBeDefined()
      expect(mockErrorConflict.details).toHaveProperty('currentVersion')
    })

    it('should validate mockErrorRateLimit has retryAfter in details', () => {
      expect(mockErrorRateLimit.details).toBeDefined()
      expect(mockErrorRateLimit.details).toHaveProperty('retryAfter', 300)
    })
  })
})
