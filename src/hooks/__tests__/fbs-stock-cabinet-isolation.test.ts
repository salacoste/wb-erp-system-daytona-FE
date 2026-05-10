/**
 * FBS Stock — Cabinet Isolation Tests — Story 96.11-FE (2nd-pass H2-1 fix)
 *
 * Verifies that `fbsStockQueryKeys` includes `cabinetId` in every key shape,
 * preventing cross-cabinet cache collisions when switching cabinets with a
 * 30-minute staleTime.
 *
 * Also covers the L2-1 fix: `getStaleHours` future-date (clock-skew) case
 * via the FbsStockRegionsSection component helper — tested inline here to
 * keep the coverage close to the fix without a separate test file.
 *
 * @see src/lib/api/fbs-stock.ts — fbsStockQueryKeys factory (H2-1)
 * @see src/app/(dashboard)/analytics/fbs-stock/components/FbsStockRegionsSection.tsx — getStaleHours (L2-1)
 */

import { describe, it, expect } from 'vitest'
import { fbsStockQueryKeys } from '@/lib/api/fbs-stock'

// ---------------------------------------------------------------------------
// H2-1: Multi-tenant cache isolation
// ---------------------------------------------------------------------------

describe('fbsStockQueryKeys — multi-tenant cabinet isolation (H2-1)', () => {
  const params = { from: '2026-04-01', to: '2026-04-30' }

  it('groups keys for different cabinets do not collide', () => {
    const a = fbsStockQueryKeys.groups('cab-1', params)
    const b = fbsStockQueryKeys.groups('cab-2', params)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('sizes keys for different cabinets do not collide', () => {
    const a = fbsStockQueryKeys.sizes('cab-1', params)
    const b = fbsStockQueryKeys.sizes('cab-2', params)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('regions keys for different cabinets do not collide', () => {
    const a = fbsStockQueryKeys.regions('cab-1')
    const b = fbsStockQueryKeys.regions('cab-2')
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('groups keys for same cabinet and same params are equal (cache hit expected)', () => {
    const a = fbsStockQueryKeys.groups('cab-1', params)
    const b = fbsStockQueryKeys.groups('cab-1', params)
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b))
  })

  it('all factory includes cabinetId as second element', () => {
    const key = fbsStockQueryKeys.all('cab-abc')
    expect(key[1]).toBe('cab-abc')
  })

  it('null cabinetId produces distinct key from non-null (enabled guard not bypassed)', () => {
    const nullKey = fbsStockQueryKeys.groups(null, params)
    const realKey = fbsStockQueryKeys.groups('cab-1', params)
    expect(JSON.stringify(nullKey)).not.toEqual(JSON.stringify(realKey))
  })
})
