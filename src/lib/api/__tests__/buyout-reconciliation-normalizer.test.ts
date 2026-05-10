/**
 * Boundary Normalizer Tests — Buyout Reconciliation — Story 96.14-FE
 *
 * Verifies normalizeBuyoutReconciliationResponse in buyout-reconciliation-normalizer.ts:
 *   - Dual-lookup: both snake_case and camelCase inputs normalize correctly.
 *   - Count coercion: count fields default to 0 on missing/null input.
 *   - Source enum coercion: unrecognized values fall back to 'unknown'.
 *   - Empty/malformed arrays: missing data produces empty array (no crash).
 *   - Query key factory: cabinetId scoping (Story 96.11 H2-1 multi-tenant lesson).
 *
 * Pattern 3 wiring: emptyBuyoutReconciliationResponse imported from buyout-reconciliation-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { normalizeBuyoutReconciliationResponse } from '../buyout-reconciliation-normalizer'
import { buyoutReconciliationQueryKeys } from '../buyout-reconciliation'
import { emptyBuyoutReconciliationResponse } from '@/test/fixtures/buyout-reconciliation-empty'

// ---------------------------------------------------------------------------
// Happy-path snake_case input
// ---------------------------------------------------------------------------

describe('normalizeBuyoutReconciliationResponse — snake_case input', () => {
  it('maps all fields from snake_case to camelCase frontend shape', () => {
    const raw = {
      data: [
        {
          nm_id: 12345,
          product_name: 'Тестовый товар',
          brand: 'Test Brand',
          buyout_quantity: 100,
          return_quantity: 10,
          return_without_buyout: 3,
          orphan_buyout: 2,
          return_quantity_mismatch: 1,
          source: 'sdk_reconciliation',
        },
      ],
      period: { from: '2026-04-01', to: '2026-04-30' },
      generated_at: '2026-05-01T06:30:00Z',
    }

    const result = normalizeBuyoutReconciliationResponse(raw)

    expect(result.data).toHaveLength(1)
    const item = result.data[0]
    expect(item.nmId).toBe(12345)
    expect(item.productName).toBe('Тестовый товар')
    expect(item.brand).toBe('Test Brand')
    expect(item.buyoutQuantity).toBe(100)
    expect(item.returnQuantity).toBe(10)
    expect(item.returnWithoutBuyout).toBe(3)
    expect(item.orphanBuyout).toBe(2)
    expect(item.returnQuantityMismatch).toBe(1)
    expect(item.source).toBe('sdk_reconciliation')
    expect(result.period.from).toBe('2026-04-01')
    expect(result.period.to).toBe('2026-04-30')
    expect(result.generatedAt).toBe('2026-05-01T06:30:00Z')
  })
})

// ---------------------------------------------------------------------------
// Happy-path camelCase input (dual-lookup)
// ---------------------------------------------------------------------------

describe('normalizeBuyoutReconciliationResponse — camelCase input', () => {
  it('maps all fields from camelCase correctly (dual-lookup absorbs backend casing drift)', () => {
    const raw = {
      data: [
        {
          nmId: 99999,
          productName: 'Camel товар',
          brand: 'Camel Brand',
          buyoutQuantity: 50,
          returnQuantity: 5,
          returnWithoutBuyout: 1,
          orphanBuyout: 0,
          returnQuantityMismatch: 0,
          source: 'weekly',
        },
      ],
      period: { from: '2026-03-01', to: '2026-03-31' },
      generatedAt: '2026-04-01T06:30:00Z',
    }

    const result = normalizeBuyoutReconciliationResponse(raw)

    expect(result.data[0].nmId).toBe(99999)
    expect(result.data[0].productName).toBe('Camel товар')
    expect(result.data[0].returnWithoutBuyout).toBe(1)
    expect(result.data[0].orphanBuyout).toBe(0)
    expect(result.data[0].source).toBe('weekly')
    expect(result.generatedAt).toBe('2026-04-01T06:30:00Z')
  })
})

// ---------------------------------------------------------------------------
// Source enum coercion
// ---------------------------------------------------------------------------

describe('normalizeBuyoutReconciliationResponse — source enum coercion', () => {
  it('coerces unrecognized source string to "unknown"', () => {
    const raw = {
      data: [{ nm_id: 1, source: 'future_source_v2' }],
      period: {},
    }

    const result = normalizeBuyoutReconciliationResponse(raw)

    expect(result.data[0].source).toBe('unknown')
  })

  it('coerces null/missing source to "unknown"', () => {
    const raw = {
      data: [{ nm_id: 2, source: null }],
      period: {},
    }

    const result = normalizeBuyoutReconciliationResponse(raw)

    expect(result.data[0].source).toBe('unknown')
  })

  it('preserves all valid source enum values', () => {
    const validSources = ['sdk_reconciliation', 'weekly', 'realtime', 'blended', 'unknown'] as const
    validSources.forEach(source => {
      const raw = { data: [{ nm_id: 1, source }], period: {} }
      const result = normalizeBuyoutReconciliationResponse(raw)
      expect(result.data[0].source).toBe(source)
    })
  })
})

// ---------------------------------------------------------------------------
// Count coercion — missing / null fields default to 0
// ---------------------------------------------------------------------------

describe('normalizeBuyoutReconciliationResponse — count field coercion', () => {
  it('defaults all count fields to 0 when missing', () => {
    const raw = { data: [{}], period: {} }

    const result = normalizeBuyoutReconciliationResponse(raw)
    const item = result.data[0]

    expect(item.nmId).toBe(0)
    expect(item.buyoutQuantity).toBe(0)
    expect(item.returnQuantity).toBe(0)
    expect(item.returnWithoutBuyout).toBe(0)
    expect(item.orphanBuyout).toBe(0)
    expect(item.returnQuantityMismatch).toBe(0)
  })

  it('preserves zero anomaly counts (0 is valid — means no anomaly)', () => {
    const raw = {
      data: [
        {
          nm_id: 50,
          return_without_buyout: 0,
          orphan_buyout: 0,
          return_quantity_mismatch: 0,
        },
      ],
      period: {},
    }

    const result = normalizeBuyoutReconciliationResponse(raw)
    const item = result.data[0]

    expect(item.returnWithoutBuyout).toBe(0)
    expect(item.orphanBuyout).toBe(0)
    expect(item.returnQuantityMismatch).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Empty / malformed envelope
// ---------------------------------------------------------------------------

describe('normalizeBuyoutReconciliationResponse — empty/malformed envelope', () => {
  it('returns empty data array for null input', () => {
    const result = normalizeBuyoutReconciliationResponse(null)
    expect(result.data).toEqual([])
    expect(result.period.from).toBe('')
    expect(result.period.to).toBe('')
    expect(result.generatedAt).toBe('')
  })

  it('returns empty data array when data field is missing', () => {
    const result = normalizeBuyoutReconciliationResponse({ period: { from: 'x', to: 'y' } })
    expect(result.data).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Query key factory — cabinetId scoping (Story 96.11 H2-1 lesson)
// ---------------------------------------------------------------------------

describe('buyoutReconciliationQueryKeys — cabinet isolation', () => {
  it('includes cabinetId as first segment to prevent cross-cabinet cache collisions', () => {
    const key = buyoutReconciliationQueryKeys.list('cab-abc', {
      from: '2026-04-01',
      to: '2026-04-30',
    })
    expect(key[0]).toBe('buyout-reconciliation')
    expect(key[1]).toBe('cab-abc')
  })

  it('generates different keys for different cabinetIds', () => {
    const keyA = buyoutReconciliationQueryKeys.list('cab-A', {
      from: '2026-04-01',
      to: '2026-04-30',
    })
    const keyB = buyoutReconciliationQueryKeys.list('cab-B', {
      from: '2026-04-01',
      to: '2026-04-30',
    })
    expect(keyA).not.toEqual(keyB)
  })

  it('Pattern 3 wiring proof: emptyBuyoutReconciliationResponse produces valid response shape', () => {
    const empty = emptyBuyoutReconciliationResponse()
    expect(empty.data).toEqual([])
    expect(empty.period.from).toBe('')
    expect(empty.period.to).toBe('')
    expect(empty.generatedAt).toBe('')
  })
})
