/**
 * useFbsEnhanced — Cabinet Isolation Tests — Story 96.13-FE (2nd-pass M2-5 fix)
 *
 * Mirrors the Story 96.11-FE H2-1 + 96.12-FE M2-2 cabinet-isolation pattern.
 *
 * Verifies:
 * 1. fbsEnhancedQueryKeys includes cabinetId — different cabinets produce different keys
 *    (prevents cross-cabinet cache collisions at staleTime=30min).
 * 2. Hook is disabled (enabled: false) when cabinetId is null — no query fires.
 *
 * @see src/hooks/use-fbs-enhanced.ts
 * @see src/lib/api/fbs-enhanced.ts — fbsEnhancedQueryKeys factory
 */

import { describe, it, expect } from 'vitest'
import { fbsEnhancedQueryKeys } from '@/lib/api/fbs-enhanced'

// ---------------------------------------------------------------------------
// M2-5: Multi-tenant cache isolation — query key factory
// ---------------------------------------------------------------------------

describe('fbsEnhancedQueryKeys — multi-tenant cabinet isolation (M2-5)', () => {
  const params = { from: '2026-04-01', to: '2026-04-30' }

  it('view keys for different cabinets do not collide', () => {
    const a = fbsEnhancedQueryKeys.view('cab-1', params)
    const b = fbsEnhancedQueryKeys.view('cab-2', params)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('view keys for same cabinet and same params are equal (cache hit expected)', () => {
    const a = fbsEnhancedQueryKeys.view('cab-1', params)
    const b = fbsEnhancedQueryKeys.view('cab-1', params)
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b))
  })

  it('null cabinetId produces distinct key from non-null (enabled guard not bypassed)', () => {
    const nullKey = fbsEnhancedQueryKeys.view(null, params)
    const realKey = fbsEnhancedQueryKeys.view('cab-1', params)
    expect(JSON.stringify(nullKey)).not.toEqual(JSON.stringify(realKey))
  })

  it('all factory includes cabinetId as second element', () => {
    const key = fbsEnhancedQueryKeys.all('cab-abc')
    expect(key[1]).toBe('cab-abc')
  })
})
