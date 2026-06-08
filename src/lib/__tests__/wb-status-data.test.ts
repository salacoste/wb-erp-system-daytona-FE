/**
 * Unit Tests for WB Status Data (Core + Delivery + Merged Config)
 * Covers: WB_STATUS_CONFIG_CORE, WB_STATUS_CONFIG, UNKNOWN_STATUS_CONFIG
 *         structural integrity, category coverage, final state correctness
 */

import { describe, it, expect } from 'vitest'
import {
  WB_STATUS_CONFIG_CORE,
  type WbStatusConfig,
  type WbStatusCategory,
} from '../wb-status-data-core'
import { WB_STATUS_CONFIG, UNKNOWN_STATUS_CONFIG } from '../wb-status-data-delivery'

// =============================================================================
// WB_STATUS_CONFIG_CORE
// =============================================================================

describe('WB_STATUS_CONFIG_CORE', () => {
  it('contains all expected core status keys', () => {
    const expectedKeys = [
      'created',
      'waiting',
      'assembling',
      'assembled',
      'ready_for_supply',
      'sorted',
      'sorted_by_wh',
      'accepted_by_wh',
      'on_way_to_storage',
      'accepted_at_storage',
      'sorted_by_wb',
      'on_way_to_pvz',
      'arrived_at_pvz',
      'on_way_to_client',
    ]
    expectedKeys.forEach(key => {
      expect(WB_STATUS_CONFIG_CORE[key]).toBeDefined()
    })
  })

  it('each core entry has all required WbStatusConfig fields', () => {
    Object.values(WB_STATUS_CONFIG_CORE).forEach(config => {
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('labelEn')
      expect(config).toHaveProperty('category')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('isFinal')
      expect(config).toHaveProperty('sortOrder')
      expect(typeof config.isFinal).toBe('boolean')
      expect(typeof config.sortOrder).toBe('number')
    })
  })

  it('core statuses are all non-final', () => {
    Object.values(WB_STATUS_CONFIG_CORE).forEach(config => {
      expect(config.isFinal).toBe(false)
    })
  })

  it('sortOrder values are unique within core', () => {
    const orders = Object.values(WB_STATUS_CONFIG_CORE).map(c => c.sortOrder)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('covers categories: creation, seller_processing, warehouse, logistics', () => {
    const categories = new Set(Object.values(WB_STATUS_CONFIG_CORE).map(c => c.category))
    expect(categories.has('creation')).toBe(true)
    expect(categories.has('seller_processing')).toBe(true)
    expect(categories.has('warehouse')).toBe(true)
    expect(categories.has('logistics')).toBe(true)
  })
})

// =============================================================================
// WB_STATUS_CONFIG (merged)
// =============================================================================

describe('WB_STATUS_CONFIG', () => {
  it('includes all core statuses', () => {
    Object.keys(WB_STATUS_CONFIG_CORE).forEach(key => {
      expect(WB_STATUS_CONFIG[key]).toBeDefined()
    })
  })

  it('includes delivery statuses', () => {
    expect(WB_STATUS_CONFIG.received_by_client).toBeDefined()
    expect(WB_STATUS_CONFIG.sold).toBeDefined()
    expect(WB_STATUS_CONFIG.delivering).toBeDefined()
    expect(WB_STATUS_CONFIG.ready_for_pickup).toBeDefined()
  })

  it('includes cancellation statuses', () => {
    expect(WB_STATUS_CONFIG.canceled).toBeDefined()
    expect(WB_STATUS_CONFIG.canceled_by_seller).toBeDefined()
    expect(WB_STATUS_CONFIG.canceled_by_wh).toBeDefined()
    expect(WB_STATUS_CONFIG.canceled_by_client).toBeDefined()
    expect(WB_STATUS_CONFIG.declined_by_client).toBeDefined()
    expect(WB_STATUS_CONFIG.canceled_by_wb).toBeDefined()
    expect(WB_STATUS_CONFIG.cancel).toBeDefined()
  })

  it('delivery success statuses are final', () => {
    expect(WB_STATUS_CONFIG.received_by_client.isFinal).toBe(true)
    expect(WB_STATUS_CONFIG.sold.isFinal).toBe(true)
  })

  it('delivering and ready_for_pickup are non-final', () => {
    expect(WB_STATUS_CONFIG.delivering.isFinal).toBe(false)
    expect(WB_STATUS_CONFIG.ready_for_pickup.isFinal).toBe(false)
  })

  it('most cancellation statuses are final', () => {
    expect(WB_STATUS_CONFIG.canceled.isFinal).toBe(true)
    expect(WB_STATUS_CONFIG.canceled_by_seller.isFinal).toBe(true)
    expect(WB_STATUS_CONFIG.canceled_by_client.isFinal).toBe(true)
  })

  it('declined_by_client is NOT final (per F-11 review F3)', () => {
    expect(WB_STATUS_CONFIG.declined_by_client.isFinal).toBe(false)
  })

  it('covers all 7 categories', () => {
    const categories = new Set(Object.values(WB_STATUS_CONFIG).map(c => c.category))
    const expectedCategories: WbStatusCategory[] = [
      'creation',
      'seller_processing',
      'warehouse',
      'logistics',
      'delivery',
      'cancellation',
      'return',
    ]
    expectedCategories.forEach(cat => {
      expect(categories.has(cat)).toBe(true)
    })
  })

  it('all merged statuses have non-empty labels', () => {
    Object.values(WB_STATUS_CONFIG).forEach(config => {
      expect(config.label.length).toBeGreaterThan(0)
    })
  })

  it('ready_for_pickup has correct Russian label (F-11 fix)', () => {
    expect(WB_STATUS_CONFIG.ready_for_pickup.label).toBe('Готов к выдаче')
  })
})

// =============================================================================
// UNKNOWN_STATUS_CONFIG
// =============================================================================

describe('UNKNOWN_STATUS_CONFIG', () => {
  it('has category "other"', () => {
    expect(UNKNOWN_STATUS_CONFIG.category).toBe('other')
  })

  it('is not final', () => {
    expect(UNKNOWN_STATUS_CONFIG.isFinal).toBe(false)
  })

  it('has sort order 99 (last)', () => {
    expect(UNKNOWN_STATUS_CONFIG.sortOrder).toBe(99)
  })

  it('has Russian label indicating unknown status', () => {
    expect(UNKNOWN_STATUS_CONFIG.label).toContain('Неизвестный')
  })

  it('has gray colors', () => {
    expect(UNKNOWN_STATUS_CONFIG.color).toContain('gray')
    expect(UNKNOWN_STATUS_CONFIG.bgColor).toContain('gray')
  })

  it('satisfies WbStatusConfig interface', () => {
    const config: WbStatusConfig = UNKNOWN_STATUS_CONFIG
    expect(config).toBeDefined()
  })
})
