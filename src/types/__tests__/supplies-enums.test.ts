/**
 * Tests for Supplies Enums & Basic Types
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests validate enum/type definitions for SupplyStatus, StickerFormat, etc.
 */

import { describe, it, expect } from 'vitest'
import type {
  SupplyStatus,
  StickerFormat,
  DocumentType,
  SuppliesSortField,
  SortOrder,
} from '@/types/supplies'
import {
  SUPPLY_STATUSES,
  STICKER_FORMATS,
  DOCUMENT_TYPES,
  SORT_FIELDS,
  SORT_ORDERS,
} from '@/test/fixtures/supplies'

// =============================================================================
// SECTION 1: SupplyStatus Enum Tests
// =============================================================================

describe('SupplyStatus Enum', () => {
  describe('valid status values', () => {
    it('should have OPEN status', () => {
      expect(SUPPLY_STATUSES).toContain('OPEN')
    })

    it('should have CLOSED status', () => {
      expect(SUPPLY_STATUSES).toContain('CLOSED')
    })

    it('should have DELIVERING status', () => {
      expect(SUPPLY_STATUSES).toContain('DELIVERING')
    })

    it('should have DELIVERED status', () => {
      expect(SUPPLY_STATUSES).toContain('DELIVERED')
    })

    it('should have CANCELLED status', () => {
      expect(SUPPLY_STATUSES).toContain('CANCELLED')
    })

    it('should have exactly 5 status values', () => {
      expect(SUPPLY_STATUSES).toHaveLength(5)
    })
  })

  describe('status type narrowing', () => {
    it('should allow assignment of valid status string', () => {
      const status: SupplyStatus = 'OPEN'
      expect(status).toBe('OPEN')
    })

    it('should not allow invalid status strings at compile time', () => {
      // Runtime check: ensure only known values are in the union
      const validStatuses = new Set<string>(SUPPLY_STATUSES)
      const invalidValue = 'UNKNOWN'
      expect(validStatuses.has(invalidValue)).toBe(false)
    })

    it('should work in switch statements with exhaustive check', () => {
      function getLabel(status: SupplyStatus): string {
        switch (status) {
          case 'OPEN':
            return 'Открыта'
          case 'CLOSED':
            return 'Закрыта'
          case 'DELIVERING':
            return 'В пути'
          case 'DELIVERED':
            return 'Доставлена'
          case 'CANCELLED':
            return 'Отменена'
        }
      }

      expect(getLabel('OPEN')).toBe('Открыта')
      expect(getLabel('CANCELLED')).toBe('Отменена')
    })
  })
})

// =============================================================================
// SECTION 2: StickerFormat Type Tests
// =============================================================================

describe('StickerFormat Type', () => {
  describe('valid format values', () => {
    it('should accept png format', () => {
      const format: StickerFormat = 'png'
      expect(format).toBe('png')
      expect(STICKER_FORMATS).toContain('png')
    })

    it('should accept svg format', () => {
      const format: StickerFormat = 'svg'
      expect(format).toBe('svg')
      expect(STICKER_FORMATS).toContain('svg')
    })

    it('should accept zpl format', () => {
      const format: StickerFormat = 'zpl'
      expect(format).toBe('zpl')
      expect(STICKER_FORMATS).toContain('zpl')
    })

    it('should have exactly 3 format values', () => {
      expect(STICKER_FORMATS).toHaveLength(3)
    })
  })

  describe('format type narrowing', () => {
    it('should allow assignment of valid format string', () => {
      const format: StickerFormat = 'svg'
      expect(['png', 'svg', 'zpl']).toContain(format)
    })

    it('should work in conditional statements', () => {
      function isVectorFormat(format: StickerFormat): boolean {
        return format === 'svg'
      }

      expect(isVectorFormat('svg')).toBe(true)
      expect(isVectorFormat('png')).toBe(false)
    })
  })
})

// =============================================================================
// SECTION 3: DocumentType Type Tests
// =============================================================================

describe('DocumentType Type', () => {
  describe('valid document types', () => {
    it('should accept sticker type', () => {
      const docType: DocumentType = 'sticker'
      expect(docType).toBe('sticker')
      expect(DOCUMENT_TYPES).toContain('sticker')
    })

    it('should accept barcode type', () => {
      const docType: DocumentType = 'barcode'
      expect(docType).toBe('barcode')
      expect(DOCUMENT_TYPES).toContain('barcode')
    })

    it('should accept acceptance_act type', () => {
      const docType: DocumentType = 'acceptance_act'
      expect(docType).toBe('acceptance_act')
      expect(DOCUMENT_TYPES).toContain('acceptance_act')
    })

    it('should have exactly 3 document types', () => {
      expect(DOCUMENT_TYPES).toHaveLength(3)
    })
  })
})

// =============================================================================
// SECTION 4: SuppliesSortField Type Tests
// =============================================================================

describe('SuppliesSortField Type', () => {
  describe('valid sort fields', () => {
    it('should accept created_at field', () => {
      const field: SuppliesSortField = 'created_at'
      expect(field).toBe('created_at')
      expect(SORT_FIELDS).toContain('created_at')
    })

    it('should accept closed_at field', () => {
      const field: SuppliesSortField = 'closed_at'
      expect(field).toBe('closed_at')
      expect(SORT_FIELDS).toContain('closed_at')
    })

    it('should accept orders_count field', () => {
      const field: SuppliesSortField = 'orders_count'
      expect(field).toBe('orders_count')
      expect(SORT_FIELDS).toContain('orders_count')
    })

    it('should have exactly 3 sort fields', () => {
      expect(SORT_FIELDS).toHaveLength(3)
    })
  })
})

// =============================================================================
// SECTION 5: SortOrder Type Tests
// =============================================================================

describe('SortOrder Type', () => {
  describe('valid sort orders', () => {
    it('should accept asc order', () => {
      const order: SortOrder = 'asc'
      expect(order).toBe('asc')
      expect(SORT_ORDERS).toContain('asc')
    })

    it('should accept desc order', () => {
      const order: SortOrder = 'desc'
      expect(order).toBe('desc')
      expect(SORT_ORDERS).toContain('desc')
    })

    it('should have exactly 2 sort orders', () => {
      expect(SORT_ORDERS).toHaveLength(2)
    })
  })
})
