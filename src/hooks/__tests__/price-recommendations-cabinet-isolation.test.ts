/**
 * Price Recommendations — Cabinet Isolation Tests — Story W3-FE
 *
 * Verifies that `priceRecommendationQueryKeys` embeds cabinetId in every
 * concrete key (list / detail / history), preventing cross-cabinet cache
 * collisions when switching cabinets with a 60s staleTime / 5min gcTime.
 * Precedent: fbs-stock-cabinet-isolation.test.ts (Story 96.11-FE H2-1).
 *
 * Discipline: multi-tenant cabinet-isolation (Story 97.5-FE) — 4-cabinet ×
 * JSON.stringify pairwise comparison suite.
 *
 * @see src/hooks/usePriceRecommendations.ts — priceRecommendationQueryKeys factory
 */

import { describe, it, expect } from 'vitest'
import { priceRecommendationQueryKeys } from '@/hooks/usePriceRecommendations'
import type { PriceRecommendationsParams } from '@/types/price-recommendations'

describe('priceRecommendationQueryKeys — multi-tenant cabinet isolation (W3-FE)', () => {
  const cabinets = ['cab-1', 'cab-2', 'cab-3', 'cab-4'] as const
  const params: PriceRecommendationsParams = { limit: 20, gap_filter: 'above', sort: 'gap_pct' }
  const nmId = 12345
  const limit = 12

  /** Build one concrete key per cabinet for a given kind (same params/nmId/limit). */
  function buildKeys(): string[][] {
    return cabinets.map(cabinetId => [
      JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params)),
      JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId)),
      JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, limit)),
    ])
  }

  it('every concrete key embeds its cabinetId', () => {
    for (const cabinetId of cabinets) {
      expect(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))).toContain(
        `"${cabinetId}"`
      )
      expect(JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId))).toContain(
        `"${cabinetId}"`
      )
      expect(
        JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, limit))
      ).toContain(`"${cabinetId}"`)
    }
  })

  it('same params/nmId/limit across 4 cabinets — all 12 keys pairwise distinct', () => {
    const keys = buildKeys().flat()
    const unique = new Set(keys)
    expect(unique.size).toBe(cabinets.length * 3)
    expect(keys.length).toBe(cabinets.length * 3)
  })

  it('same cabinet + same args reproduce the identical key (determinism / cache hit)', () => {
    for (const cabinetId of cabinets) {
      expect(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))).toEqual(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))
      )
      expect(JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId))).toEqual(
        JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId))
      )
      expect(JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, limit))).toEqual(
        JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, limit))
      )
    }
  })

  it('null-cabinet placeholder key ("") differs from any real cabinet key', () => {
    const placeholderList = JSON.stringify(priceRecommendationQueryKeys.list('', params))
    const placeholderDetail = JSON.stringify(priceRecommendationQueryKeys.detail('', nmId))
    const placeholderHistory = JSON.stringify(priceRecommendationQueryKeys.history('', nmId, limit))
    for (const cabinetId of cabinets) {
      expect(placeholderList).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))
      )
      expect(placeholderDetail).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId))
      )
      expect(placeholderHistory).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, limit))
      )
    }
  })

  it('all keys are covered by prefix invalidation via queryKeys.all', () => {
    // JSON.stringify(all).slice(0, -1) drops the closing bracket:
    // ["price-recommendations"] → ["price-recommendations" — every key string
    // must start with it so invalidateQueries({ queryKey: all }) matches all.
    const prefix = JSON.stringify(priceRecommendationQueryKeys.all).slice(0, -1)
    const groupKeys = [
      priceRecommendationQueryKeys.lists(),
      priceRecommendationQueryKeys.details(),
      priceRecommendationQueryKeys.histories(),
    ].map(key => JSON.stringify(key))
    for (const key of [...buildKeys().flat(), ...groupKeys]) {
      expect(key.startsWith(prefix)).toBe(true)
    }
  })
})
