/**
 * Tests for Supplies Core Interfaces
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests validate SupplyOrder, SupplyDocument, SupplyListItem, Supply interfaces.
 */

import { describe, it, expect } from 'vitest'
import type {
  SupplyOrder,
  SupplyDocument,
  SupplyListItem,
  Supply,
  SupplyStatus,
} from '@/types/supplies'
import {
  mockSupplyOrder,
  mockSupplyOrderNoName,
  mockStickerDocumentPng,
  mockDocumentNoSize,
  mockSupplyListItemOpen,
  mockSupplyListItemClosed,
  mockSupplyListItemNoName,
  mockSupplyOpen,
  mockSupplyEmpty,
  mockSupplyClosed,
} from '@/test/fixtures/supplies'

// =============================================================================
// SECTION 1: SupplyOrder Interface Tests
// =============================================================================

describe('SupplyOrder Interface', () => {
  describe('required fields', () => {
    it('should require orderId as string', () => {
      expect(typeof mockSupplyOrder.orderId).toBe('string')
      expect(mockSupplyOrder.orderId.length).toBeGreaterThan(0)
    })

    it('should require orderUid as string', () => {
      expect(typeof mockSupplyOrder.orderUid).toBe('string')
      expect(mockSupplyOrder.orderUid.length).toBeGreaterThan(0)
    })

    it('should require nmId as number', () => {
      expect(typeof mockSupplyOrder.nmId).toBe('number')
    })

    it('should require vendorCode as string', () => {
      expect(typeof mockSupplyOrder.vendorCode).toBe('string')
      expect(mockSupplyOrder.vendorCode.length).toBeGreaterThan(0)
    })

    it('should require salePrice as number', () => {
      expect(typeof mockSupplyOrder.salePrice).toBe('number')
      expect(mockSupplyOrder.salePrice).toBeGreaterThanOrEqual(0)
    })

    it('should require supplierStatus as string', () => {
      expect(typeof mockSupplyOrder.supplierStatus).toBe('string')
      expect(mockSupplyOrder.supplierStatus.length).toBeGreaterThan(0)
    })

    it('should require addedAt as string (ISO date)', () => {
      expect(typeof mockSupplyOrder.addedAt).toBe('string')
      expect(new Date(mockSupplyOrder.addedAt).toISOString()).toBe(mockSupplyOrder.addedAt)
    })
  })

  describe('nullable fields', () => {
    it('should allow productName to be null', () => {
      const order: SupplyOrder = mockSupplyOrderNoName
      expect(order.productName).toBeNull()
    })

    it('should allow productName to be string', () => {
      const order: SupplyOrder = mockSupplyOrder
      expect(typeof order.productName).toBe('string')
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSupplyOrder has all required fields', () => {
      expect(mockSupplyOrder).toHaveProperty('orderId')
      expect(mockSupplyOrder).toHaveProperty('orderUid')
      expect(mockSupplyOrder).toHaveProperty('nmId')
      expect(mockSupplyOrder).toHaveProperty('vendorCode')
      expect(mockSupplyOrder).toHaveProperty('salePrice')
      expect(mockSupplyOrder).toHaveProperty('supplierStatus')
      expect(mockSupplyOrder).toHaveProperty('addedAt')
    })

    it('should validate mockSupplyOrderNoName has null productName', () => {
      expect(mockSupplyOrderNoName.productName).toBeNull()
      expect(mockSupplyOrderNoName.orderId).toBeDefined()
    })
  })
})

// =============================================================================
// SECTION 2: SupplyDocument Interface Tests
// =============================================================================

describe('SupplyDocument Interface', () => {
  describe('required fields', () => {
    it('should require type as DocumentType', () => {
      const doc: SupplyDocument = mockStickerDocumentPng
      expect(['sticker', 'barcode', 'acceptance_act']).toContain(doc.type)
    })

    it('should require format as string', () => {
      expect(typeof mockStickerDocumentPng.format).toBe('string')
      expect(mockStickerDocumentPng.format.length).toBeGreaterThan(0)
    })

    it('should require generatedAt as string (ISO date)', () => {
      expect(typeof mockStickerDocumentPng.generatedAt).toBe('string')
      expect(new Date(mockStickerDocumentPng.generatedAt).toISOString()).toBe(
        mockStickerDocumentPng.generatedAt
      )
    })

    it('should require downloadUrl as string', () => {
      expect(typeof mockStickerDocumentPng.downloadUrl).toBe('string')
      expect(mockStickerDocumentPng.downloadUrl.length).toBeGreaterThan(0)
    })
  })

  describe('nullable fields', () => {
    it('should allow sizeBytes to be null', () => {
      expect(mockDocumentNoSize.sizeBytes).toBeNull()
    })

    it('should allow sizeBytes to be number', () => {
      expect(typeof mockStickerDocumentPng.sizeBytes).toBe('number')
    })
  })

  describe('fixture validation', () => {
    it('should validate mockStickerDocumentPng structure', () => {
      expect(mockStickerDocumentPng.type).toBe('sticker')
      expect(mockStickerDocumentPng.format).toBe('png')
      expect(mockStickerDocumentPng.sizeBytes).toBeGreaterThan(0)
    })

    it('should validate mockDocumentNoSize has null sizeBytes', () => {
      expect(mockDocumentNoSize.sizeBytes).toBeNull()
      expect(mockDocumentNoSize.type).toBe('sticker')
    })
  })
})

// =============================================================================
// SECTION 3: SupplyListItem Interface Tests
// =============================================================================

describe('SupplyListItem Interface', () => {
  describe('required fields', () => {
    it('should require id as string', () => {
      expect(typeof mockSupplyListItemOpen.id).toBe('string')
      expect(mockSupplyListItemOpen.id.length).toBeGreaterThan(0)
    })

    it('should require wbSupplyId as string', () => {
      // wbSupplyId can be string | null per the type
      const item: SupplyListItem = mockSupplyListItemOpen
      expect(item.wbSupplyId === null || typeof item.wbSupplyId === 'string').toBe(true)
    })

    it('should require status as SupplyStatus', () => {
      const validStatuses: SupplyStatus[] = [
        'OPEN',
        'CLOSED',
        'DELIVERING',
        'DELIVERED',
        'CANCELLED',
      ]
      expect(validStatuses).toContain(mockSupplyListItemOpen.status)
    })

    it('should require ordersCount as number', () => {
      expect(typeof mockSupplyListItemOpen.ordersCount).toBe('number')
      expect(mockSupplyListItemOpen.ordersCount).toBeGreaterThanOrEqual(0)
    })

    it('should require totalValue as number or undefined', () => {
      const val = mockSupplyListItemOpen.totalValue
      expect(val === undefined || typeof val === 'number').toBe(true)
    })

    it('should require createdAt as string (ISO date)', () => {
      expect(typeof mockSupplyListItemOpen.createdAt).toBe('string')
      expect(new Date(mockSupplyListItemOpen.createdAt).toISOString()).toBe(
        mockSupplyListItemOpen.createdAt
      )
    })
  })

  describe('nullable fields', () => {
    it('should allow name to be null', () => {
      expect(mockSupplyListItemNoName.name).toBeNull()
    })

    it('should allow closedAt to be null', () => {
      expect(mockSupplyListItemOpen.closedAt).toBeNull()
    })

    it('should allow syncedAt to be null', () => {
      expect(mockSupplyListItemNoName.syncedAt).toBeNull()
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSupplyListItemOpen structure', () => {
      expect(mockSupplyListItemOpen.id).toBe('supply-001')
      expect(mockSupplyListItemOpen.status).toBe('OPEN')
      expect(mockSupplyListItemOpen.ordersCount).toBe(5)
    })

    it('should validate OPEN status has null closedAt', () => {
      expect(mockSupplyListItemOpen.status).toBe('OPEN')
      expect(mockSupplyListItemOpen.closedAt).toBeNull()
    })

    it('should validate CLOSED status has closedAt', () => {
      expect(mockSupplyListItemClosed.status).toBe('CLOSED')
      expect(mockSupplyListItemClosed.closedAt).not.toBeNull()
      expect(typeof mockSupplyListItemClosed.closedAt).toBe('string')
    })

    it('should validate mockSupplyListItemNoName has null name', () => {
      expect(mockSupplyListItemNoName.name).toBeNull()
      expect(mockSupplyListItemNoName.ordersCount).toBe(0)
    })
  })
})

// =============================================================================
// SECTION 4: Supply Interface Tests (extends SupplyListItem)
// =============================================================================

describe('Supply Interface', () => {
  describe('extended fields', () => {
    it('should extend SupplyListItem', () => {
      const supply: Supply = mockSupplyOpen
      // Has SupplyListItem fields
      expect(supply.id).toBeDefined()
      expect(supply.status).toBeDefined()
      expect(supply.ordersCount).toBeDefined()
      expect(supply.createdAt).toBeDefined()
    })

    it('should add orders array', () => {
      expect(Array.isArray(mockSupplyOpen.orders)).toBe(true)
      expect(mockSupplyOpen.orders.length).toBeGreaterThan(0)
    })

    it('should add documents array', () => {
      expect(Array.isArray(mockSupplyOpen.documents)).toBe(true)
    })
  })

  describe('nullable warehouse fields', () => {
    it('should allow warehouseId to be null', () => {
      expect(mockSupplyEmpty.warehouseId).toBeNull()
    })

    it('should allow warehouseName to be null', () => {
      expect(mockSupplyEmpty.warehouseName).toBeNull()
    })
  })

  describe('fixture validation', () => {
    it('should validate mockSupplyOpen has orders array', () => {
      expect(mockSupplyOpen.orders).toHaveLength(2)
      expect(mockSupplyOpen.orders[0].orderId).toBeDefined()
    })

    it('should validate mockSupplyEmpty has empty orders', () => {
      expect(mockSupplyEmpty.orders).toHaveLength(0)
      expect(mockSupplyEmpty.documents).toHaveLength(0)
    })

    it('should validate mockSupplyClosed has documents', () => {
      expect(mockSupplyClosed.documents.length).toBeGreaterThan(0)
      expect(mockSupplyClosed.documents[0].type).toBe('sticker')
    })
  })
})
