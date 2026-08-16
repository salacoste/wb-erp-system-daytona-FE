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

  it('same cabinet + different args produce distinct keys (no within-cabinet collision)', () => {
    // TD-E Part-1a: the isolation suite must also insure the intra-cabinet
    // axis — filter changes (list) and SKU switches (detail) must never reuse
    // a stale cached entry while cabinetId stays constant.
    const paramsB: PriceRecommendationsParams = { limit: 50, gap_filter: 'below', sort: 'gap_rub' }
    const nmIdB = 67890
    for (const cabinetId of cabinets) {
      expect(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, paramsB))
      )
      expect(JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmId))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.detail(cabinetId, nmIdB))
      )
    }
  })

  it('same cabinet — each single-field param axis and each history axis yields a distinct key', () => {
    // TD-E FIX-L4: the paramsB test above changes ALL list fields at once, so a
    // key factory that collapsed just ONE axis could still pass it. Pin each
    // list axis separately (limit / gap_filter / sort — one-field diffs vs the
    // same base params), plus the history axes (limit at same nmId, nmId at
    // same limit) that no same-cabinet test covered before.
    const limitOnly: PriceRecommendationsParams = { ...params, limit: 50 }
    const gapFilterOnly: PriceRecommendationsParams = { ...params, gap_filter: 'below' }
    const sortOnly: PriceRecommendationsParams = { ...params, sort: 'gap_rub' }
    const nmIdB = 67890
    for (const cabinetId of cabinets) {
      expect(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, limitOnly))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))
      )
      expect(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, gapFilterOnly))
      ).not.toEqual(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params)))
      expect(JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, sortOnly))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.list(cabinetId, params))
      )
      // history: limit axis (same SKU) — 12 vs 24 weeks must not share a cache slot
      expect(JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, 12))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, 24))
      )
      // history: nmId axis (same limit) — SKU switch must not reuse the old SKU's entry
      expect(JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmId, 12))).not.toEqual(
        JSON.stringify(priceRecommendationQueryKeys.history(cabinetId, nmIdB, 12))
      )
    }
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

  // Two no-cabinet key conventions coexist in this codebase (TD-E Part-1b,
  // documented here rather than rewriting the hook):
  //   - fbs precedent (src/lib/api/fbs-stock.ts): key factory accepts
  //     `string | null` and embeds null directly in the key (null-param
  //     convention — see fbs-stock-cabinet-isolation.test.ts "null cabinetId").
  //   - price recommendations (src/hooks/usePriceRecommendations.ts): key
  //     factory takes `string`; hooks pass `cabinetId ?? ''`, so the no-cabinet
  //     state renders as an '' placeholder key segment (''-placeholder
  //     convention).
  // FUTURE: align the two conventions in a pass unifying null-cabinet key
  // handling across hooks; until then the test below pins the safety property
  // of the '' convention — the placeholder never equals any real cabinet's
  // key, and the hooks' `enabled: cabinetId != null` guard keeps placeholder
  // keys from ever being fetched.
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
