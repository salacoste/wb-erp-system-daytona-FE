/**
 * Unit tests for tax-analytics API client
 * Story 96.1-FE: type-safety hardening + test coverage (G-3)
 *
 * Coverage targets:
 *  1. URL construction — `getPreliminaryTax(from, to)` builds exact URL
 *     `/v1/analytics/tax/preliminary?from=<from>&to=<to>`
 *  2. Response pass-through — raw `{ tax: TaxMetrics | null }` shape preserved
 *     to consumer (no normalization, no field renaming, no nullability collapse)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'
import { getPreliminaryTax, preliminaryTaxQueryKeys } from '../tax-analytics'
import type { TaxMetrics } from '@/types/finance-summary'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const ENDPOINT = `${API_BASE_URL}/v1/analytics/tax/preliminary`

describe('tax-analytics API client', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('getPreliminaryTax — URL construction', () => {
    it('builds the exact URL with from + to query params', async () => {
      let capturedURL = ''

      server.use(
        http.get(ENDPOINT, ({ request }) => {
          capturedURL = request.url
          return HttpResponse.json({ tax: null })
        })
      )

      await getPreliminaryTax('2026-04-27', '2026-05-03')

      expect(capturedURL).toBe(`${ENDPOINT}?from=2026-04-27&to=2026-05-03`)
    })

    it('passes from + to params verbatim (no URL encoding mishaps)', async () => {
      let capturedFrom = ''
      let capturedTo = ''

      server.use(
        http.get(ENDPOINT, ({ request }) => {
          const url = new URL(request.url)
          capturedFrom = url.searchParams.get('from') ?? ''
          capturedTo = url.searchParams.get('to') ?? ''
          return HttpResponse.json({ tax: null })
        })
      )

      await getPreliminaryTax('2025-W47-mon', '2025-W47-sun')

      expect(capturedFrom).toBe('2025-W47-mon')
      expect(capturedTo).toBe('2025-W47-sun')
    })
  })

  describe('getPreliminaryTax — response pass-through', () => {
    it('returns the raw `{ tax: null }` envelope when backend has no tax setup', async () => {
      server.use(
        http.get(ENDPOINT, () => {
          return HttpResponse.json({ tax: null })
        })
      )

      const result = await getPreliminaryTax('2026-04-27', '2026-05-03')

      // Wrapped envelope preserved (Boundary Normalizer Pattern: structural identity).
      expect(result).toEqual({ tax: null })
      expect(result.tax).toBeNull()
    })

    it('returns the raw `{ tax: TaxMetrics }` envelope without normalization or field renaming', async () => {
      const populated: TaxMetrics = {
        tax_amount: 135000,
        tax_base: 2250000,
        effective_tax_rate: 6,
        tax_system: 'usn6',
        is_minimum_rule: false,
        net_profit_after_tax: null,
        vat_payer: false,
        vat_rate: null,
        vat_output: null,
        vat_payable: null,
        revenue_excl_vat: null,
        net_profit_after_all_tax: null,
        preliminary: true,
        data_completeness: {
          revenueSource: 'fulfillment',
          hasLogistics: false,
          hasStorage: true,
          hasAcceptance: false,
          hasPenalties: false,
          hasCogs: true,
          hasAdvertising: true,
        },
      }

      server.use(
        http.get(ENDPOINT, () => {
          return HttpResponse.json({ tax: populated })
        })
      )

      const result = await getPreliminaryTax('2026-04-27', '2026-05-03')

      // All snake_case fields preserved verbatim — no key renaming, no value coercion.
      expect(result.tax).not.toBeNull()
      expect(result.tax?.tax_system).toBe('usn6')
      expect(result.tax?.tax_amount).toBe(135000)
      expect(result.tax?.tax_base).toBe(2250000)
      expect(result.tax?.preliminary).toBe(true)
      expect(result.tax?.data_completeness?.hasCogs).toBe(true)
    })
  })

  describe('preliminaryTaxQueryKeys', () => {
    it('produces stable query keys based on from + to range', () => {
      const k1 = preliminaryTaxQueryKeys.byRange('2026-04-27', '2026-05-03')
      const k2 = preliminaryTaxQueryKeys.byRange('2026-04-27', '2026-05-03')
      const k3 = preliminaryTaxQueryKeys.byRange('2026-04-27', '2026-05-04')

      // Equal ranges produce structurally-equal keys.
      expect(k1).toEqual(k2)
      // Different ranges produce different keys (cache invalidation works).
      expect(k1).not.toEqual(k3)
      // All keys share the `tax`/`preliminary` namespace prefix.
      expect(k1).toEqual(['tax', 'preliminary', '2026-04-27', '2026-05-03'])
    })

    it('exposes a stable `all` namespace for cache invalidation', () => {
      expect(preliminaryTaxQueryKeys.all).toEqual(['tax', 'preliminary'])
    })
  })
})
