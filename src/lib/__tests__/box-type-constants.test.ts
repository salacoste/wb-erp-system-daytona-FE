/**
 * Unit tests for box-type-constants (Story 44.42-FE) — regression coverage added iter-139.
 *
 * Pure config (no functions/IO). Locks the box-type set + the business-CRITICAL storageFormula
 * invariant: Pallets (5) use the volume-INDEPENDENT 'fixed' formula; Boxes (2) / Supersafe (6) use
 * 'standard'. A regression here would silently mis-calculate pallet storage cost.
 */

import { describe, it, expect } from 'vitest'
import { DEFAULT_BOX_TYPE_ID, BOX_TYPES, ALL_BOX_TYPE_IDS } from '@/lib/box-type-constants'

describe('box-type constants', () => {
  it('defaults to Boxes (id 2)', () => {
    expect(DEFAULT_BOX_TYPE_ID).toBe(2)
  })

  it('lists exactly ids [2, 5, 6], matching the BOX_TYPES keys', () => {
    expect(ALL_BOX_TYPE_IDS).toEqual([2, 5, 6])
    expect(Object.keys(BOX_TYPES).map(Number).sort()).toEqual([2, 5, 6])
  })

  it('every entry key matches its .id', () => {
    for (const id of ALL_BOX_TYPE_IDS) {
      expect(BOX_TYPES[id].id).toBe(id)
    }
  })

  it('CRITICAL: Pallets (5) use the volume-independent "fixed" formula; others "standard"', () => {
    expect(BOX_TYPES[5].storageFormula).toBe('fixed')
    expect(BOX_TYPES[2].storageFormula).toBe('standard')
    expect(BOX_TYPES[6].storageFormula).toBe('standard')
  })

  it('carries Russian display names + icons for each type', () => {
    expect(BOX_TYPES[2].nameRu).toBe('Коробки')
    expect(BOX_TYPES[5].nameRu).toBe('Монопаллеты')
    expect(BOX_TYPES[6].nameRu).toBe('Суперсейф')
    for (const id of ALL_BOX_TYPE_IDS) {
      expect(BOX_TYPES[id].icon).toBeTruthy()
      expect(BOX_TYPES[id].description).toBeTruthy()
      expect(BOX_TYPES[id].name).toBeTruthy()
    }
  })
})
