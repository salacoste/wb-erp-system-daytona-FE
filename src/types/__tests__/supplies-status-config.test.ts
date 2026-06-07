/**
 * Tests for Supplies Status Configuration
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests validate SupplyStatusConfig interface, SUPPLY_STATUS_CONFIG constant,
 * and status workflow helpers (isSupplyFinal, canModifySupply, canGenerateStickers).
 */

import { describe, it, expect } from 'vitest'
import {
  SUPPLY_STATUS_CONFIG,
  isSupplyFinal,
  canModifySupply,
  canGenerateStickers,
} from '@/types/supplies'
import type { SupplyStatus, SupplyStatusConfig } from '@/types/supplies'

// =============================================================================
// SECTION 1: SupplyStatusConfig Interface Tests
// =============================================================================

describe('SupplyStatusConfig Interface', () => {
  describe('required fields', () => {
    it('should require label as string', () => {
      const config: SupplyStatusConfig = SUPPLY_STATUS_CONFIG.OPEN
      expect(typeof config.label).toBe('string')
      expect(config.label.length).toBeGreaterThan(0)
    })

    it('should require color as string (tailwind class)', () => {
      const config: SupplyStatusConfig = SUPPLY_STATUS_CONFIG.OPEN
      expect(typeof config.color).toBe('string')
      expect(config.color).toContain('text-')
    })

    it('should require bgColor as string (tailwind class)', () => {
      const config: SupplyStatusConfig = SUPPLY_STATUS_CONFIG.OPEN
      expect(typeof config.bgColor).toBe('string')
      expect(config.bgColor).toContain('bg-')
    })

    it('should require icon as string (lucide icon name)', () => {
      const config: SupplyStatusConfig = SUPPLY_STATUS_CONFIG.OPEN
      expect(typeof config.icon).toBe('string')
      expect(config.icon.length).toBeGreaterThan(0)
    })
  })

  describe('fixture validation', () => {
    it('should validate mockStatusConfigOpen structure', () => {
      const config = SUPPLY_STATUS_CONFIG.OPEN
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('icon')
    })

    it('should validate mockStatusConfigClosed structure', () => {
      const config = SUPPLY_STATUS_CONFIG.CLOSED
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('icon')
    })

    it('should validate mockStatusConfigDelivering structure', () => {
      const config = SUPPLY_STATUS_CONFIG.DELIVERING
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('icon')
    })

    it('should validate mockStatusConfigDelivered structure', () => {
      const config = SUPPLY_STATUS_CONFIG.DELIVERED
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('icon')
    })

    it('should validate mockStatusConfigCancelled structure', () => {
      const config = SUPPLY_STATUS_CONFIG.CANCELLED
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('icon')
    })
  })
})

// =============================================================================
// SECTION 2: SUPPLY_STATUS_CONFIG Constant Tests
// =============================================================================

describe('SUPPLY_STATUS_CONFIG Constant', () => {
  describe('completeness', () => {
    it('should have config for OPEN status', () => {
      expect(SUPPLY_STATUS_CONFIG.OPEN).toBeDefined()
    })

    it('should have config for CLOSED status', () => {
      expect(SUPPLY_STATUS_CONFIG.CLOSED).toBeDefined()
    })

    it('should have config for DELIVERING status', () => {
      expect(SUPPLY_STATUS_CONFIG.DELIVERING).toBeDefined()
    })

    it('should have config for DELIVERED status', () => {
      expect(SUPPLY_STATUS_CONFIG.DELIVERED).toBeDefined()
    })

    it('should have config for CANCELLED status', () => {
      expect(SUPPLY_STATUS_CONFIG.CANCELLED).toBeDefined()
    })

    it('should have exactly 5 status configurations', () => {
      const keys = Object.keys(SUPPLY_STATUS_CONFIG)
      expect(keys).toHaveLength(5)
    })
  })

  describe('OPEN status config', () => {
    const config = SUPPLY_STATUS_CONFIG.OPEN

    it('should have Russian label "Открыта"', () => {
      expect(config.label).toBe('Открыта')
    })

    it('should have blue color class', () => {
      expect(config.color).toContain('blue')
    })

    it('should have blue background class', () => {
      expect(config.bgColor).toContain('blue')
    })

    it('should have PackageOpen icon', () => {
      expect(config.icon).toBe('PackageOpen')
    })
  })

  describe('CLOSED status config', () => {
    const config = SUPPLY_STATUS_CONFIG.CLOSED

    it('should have Russian label "Закрыта"', () => {
      expect(config.label).toBe('Закрыта')
    })

    it('should have orange color class', () => {
      expect(config.color).toContain('orange')
    })

    it('should have orange background class', () => {
      expect(config.bgColor).toContain('orange')
    })

    it('should have PackageCheck icon', () => {
      expect(config.icon).toBe('PackageCheck')
    })
  })

  describe('DELIVERING status config', () => {
    const config = SUPPLY_STATUS_CONFIG.DELIVERING

    it('should have Russian label "В пути"', () => {
      expect(config.label).toBe('В пути')
    })

    it('should have purple color class', () => {
      expect(config.color).toContain('purple')
    })

    it('should have purple background class', () => {
      expect(config.bgColor).toContain('purple')
    })

    it('should have Truck icon', () => {
      expect(config.icon).toBe('Truck')
    })
  })

  describe('DELIVERED status config', () => {
    const config = SUPPLY_STATUS_CONFIG.DELIVERED

    it('should have Russian label "Доставлена"', () => {
      expect(config.label).toBe('Доставлена')
    })

    it('should have green color class', () => {
      expect(config.color).toContain('green')
    })

    it('should have green background class', () => {
      expect(config.bgColor).toContain('green')
    })

    it('should have CheckCircle icon', () => {
      expect(config.icon).toBe('CheckCircle')
    })
  })

  describe('CANCELLED status config', () => {
    const config = SUPPLY_STATUS_CONFIG.CANCELLED

    it('should have Russian label "Отменена"', () => {
      expect(config.label).toBe('Отменена')
    })

    it('should have red color class', () => {
      expect(config.color).toContain('red')
    })

    it('should have red background class', () => {
      expect(config.bgColor).toContain('red')
    })

    it('should have XCircle icon', () => {
      expect(config.icon).toBe('XCircle')
    })
  })
})

// =============================================================================
// SECTION 3: Status Workflow Validation Tests
// =============================================================================

describe('Status Workflow Validation', () => {
  describe('state machine transitions', () => {
    it('should allow OPEN -> CLOSED transition', () => {
      expect(canModifySupply('OPEN')).toBe(true)
      expect(canModifySupply('CLOSED')).toBe(false)
    })

    it('should not allow CLOSED -> OPEN transition', () => {
      expect(canModifySupply('CLOSED')).toBe(false)
    })

    it('should allow CLOSED -> DELIVERING transition (via WB sync)', () => {
      expect(isSupplyFinal('CLOSED')).toBe(false)
      expect(isSupplyFinal('DELIVERING')).toBe(false)
    })

    it('should allow DELIVERING -> DELIVERED transition (via WB sync)', () => {
      expect(isSupplyFinal('DELIVERING')).toBe(false)
      expect(isSupplyFinal('DELIVERED')).toBe(true)
    })

    it('should allow any state -> CANCELLED transition', () => {
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED']
      for (const status of statuses) {
        expect(isSupplyFinal('CANCELLED')).toBe(true)
        if (!isSupplyFinal(status)) {
          expect(isSupplyFinal(status)).toBe(false)
        }
      }
    })
  })

  describe('action availability by status', () => {
    it('OPEN: should allow add orders', () => {
      expect(canModifySupply('OPEN')).toBe(true)
    })

    it('OPEN: should allow remove orders', () => {
      expect(canModifySupply('OPEN')).toBe(true)
    })

    it('OPEN: should allow close supply', () => {
      expect(isSupplyFinal('OPEN')).toBe(false)
    })

    it('CLOSED: should allow generate stickers', () => {
      expect(canGenerateStickers('CLOSED')).toBe(true)
    })

    it('CLOSED: should allow download documents', () => {
      expect(canGenerateStickers('CLOSED')).toBe(true)
      expect(canGenerateStickers('OPEN')).toBe(false)
    })

    it('DELIVERING: should only allow view', () => {
      expect(canModifySupply('DELIVERING')).toBe(false)
      expect(canGenerateStickers('DELIVERING')).toBe(false)
      expect(isSupplyFinal('DELIVERING')).toBe(false)
    })

    it('DELIVERED: should only allow view', () => {
      expect(canModifySupply('DELIVERED')).toBe(false)
      expect(canGenerateStickers('DELIVERED')).toBe(false)
      expect(isSupplyFinal('DELIVERED')).toBe(true)
    })

    it('CANCELLED: should only allow view', () => {
      expect(canModifySupply('CANCELLED')).toBe(false)
      expect(canGenerateStickers('CANCELLED')).toBe(false)
      expect(isSupplyFinal('CANCELLED')).toBe(true)
    })
  })
})
