/**
 * Unit tests for supplies-utils (barrel re-export)
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 *
 * Tests that re-exports from @/types/supplies work correctly.
 */

import { describe, it, expect } from 'vitest'
import type { SupplyStatus } from '@/types/supplies'
import {
  SUPPLY_STATUS_CONFIG,
  getSupplyStatusConfig,
  getSupplyStatusLabel,
  isSupplyFinal,
  canModifySupply,
  canGenerateStickers,
} from '../supplies-utils'

// ============================================================================
// Re-export integrity — smoke tests
// ============================================================================

/** Get first known status key typed as SupplyStatus */
const firstStatus = (): SupplyStatus => {
  const keys = Object.keys(SUPPLY_STATUS_CONFIG) as SupplyStatus[]
  return keys[0] ?? 'OPEN'
}

describe('supplies-utils re-exports', () => {
  describe('SUPPLY_STATUS_CONFIG', () => {
    it('is a non-empty object', () => {
      expect(typeof SUPPLY_STATUS_CONFIG).toBe('object')
      expect(Object.keys(SUPPLY_STATUS_CONFIG).length).toBeGreaterThan(0)
    })
  })

  describe('getSupplyStatusConfig', () => {
    it('returns config for known status', () => {
      const status = firstStatus()
      const config = getSupplyStatusConfig(status)
      expect(config).toBeDefined()
      expect(config.label).toBeDefined()
    })
  })

  describe('getSupplyStatusLabel', () => {
    it('returns a string label for known status', () => {
      const status = firstStatus()
      const label = getSupplyStatusLabel(status)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })

  describe('isSupplyFinal', () => {
    it('returns a boolean for known status', () => {
      const status = firstStatus()
      const result = isSupplyFinal(status)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('canModifySupply', () => {
    it('returns a boolean for known status', () => {
      const status = firstStatus()
      const result = canModifySupply(status)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('canGenerateStickers', () => {
    it('returns a boolean for known status', () => {
      const status = firstStatus()
      const result = canGenerateStickers(status)
      expect(typeof result).toBe('boolean')
    })
  })
})
