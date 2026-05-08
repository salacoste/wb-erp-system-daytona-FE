/**
 * Unit tests for usePreliminaryTax hook
 * Story 96.1-FE: type-safety hardening + test coverage (G-2)
 *
 * Coverage targets:
 *  1. `tax: null` response (no tax setup) → hook returns null
 *  2. Populated `usn6` → hook returns TaxMetrics with snake_case fields
 *  3. Populated `usn15` with `vat_payer: true` → all VAT fields preserved
 *  4. Error path (503 service unavailable) → hook returns null gracefully
 *
 * Pattern: mirrors src/hooks/__tests__/useUnitEconomics.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import { usePreliminaryTax } from '../usePreliminaryTax'
import { renderHookWithClient, setupMockAuth, clearMockAuth } from '@/test/test-utils'
import type { TaxMetrics } from '@/types/finance-summary'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const ENDPOINT = `${API_BASE_URL}/v1/analytics/tax/preliminary`

const FROM = '2026-04-27'
const TO = '2026-05-03'

describe('usePreliminaryTax', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('successful responses', () => {
    it('returns null when backend responds with { tax: null } (no tax setup)', async () => {
      // Deterministic pattern: count handler invocations so we know the request settled
      // before asserting "still null". Avoids hard-wait setTimeout anti-pattern (CLAUDE.md
      // ### Known Anti-Patterns #7 — applies to E2E but the principle generalizes).
      let requestCount = 0
      server.use(
        http.get(ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json({ tax: null })
        })
      )

      const { result } = renderHookWithClient(() => usePreliminaryTax({ from: FROM, to: TO }))

      // Initial render before query settles → null (default state).
      expect(result.current).toBeNull()

      // Wait deterministically for the handler to fire AND the query to settle.
      // After the request resolves with { tax: null }, hook still returns null.
      await waitFor(() => {
        expect(requestCount).toBe(1)
      })
      expect(result.current).toBeNull()
    })

    it('returns populated TaxMetrics for usn6 income tax system', async () => {
      const populatedMetrics: TaxMetrics = {
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
          return HttpResponse.json({ tax: populatedMetrics })
        })
      )

      const { result } = renderHookWithClient(() => usePreliminaryTax({ from: FROM, to: TO }))

      await waitFor(() => {
        expect(result.current).not.toBeNull()
      })

      expect(result.current?.tax_system).toBe('usn6')
      expect(result.current?.tax_amount).toBe(135000)
      expect(result.current?.tax_base).toBe(2250000)
      expect(result.current?.effective_tax_rate).toBe(6)
      expect(result.current?.is_minimum_rule).toBe(false)
      expect(result.current?.preliminary).toBe(true)
      expect(result.current?.vat_payer).toBe(false)
      expect(result.current?.data_completeness?.hasCogs).toBe(true)
    })

    it('returns populated TaxMetrics for usn15 with VAT enabled (all VAT fields preserved)', async () => {
      const usn15WithVat: TaxMetrics = {
        tax_amount: 337500,
        tax_base: 2250000,
        effective_tax_rate: 15,
        tax_system: 'usn15',
        is_minimum_rule: false,
        net_profit_after_tax: 1912500,
        vat_payer: true,
        vat_rate: 20,
        vat_output: 450000,
        vat_payable: 420000,
        revenue_excl_vat: 1875000,
        net_profit_after_all_tax: 1492500,
        preliminary: true,
        data_completeness: {
          revenueSource: 'fulfillment',
          hasLogistics: true,
          hasStorage: true,
          hasAcceptance: true,
          hasPenalties: false,
          hasCogs: true,
          hasAdvertising: true,
        },
      }

      server.use(
        http.get(ENDPOINT, () => {
          return HttpResponse.json({ tax: usn15WithVat })
        })
      )

      const { result } = renderHookWithClient(() => usePreliminaryTax({ from: FROM, to: TO }))

      await waitFor(() => {
        expect(result.current).not.toBeNull()
      })

      // Income tax fields
      expect(result.current?.tax_system).toBe('usn15')
      expect(result.current?.effective_tax_rate).toBe(15)

      // VAT fields all preserved through hook
      expect(result.current?.vat_payer).toBe(true)
      expect(result.current?.vat_rate).toBe(20)
      expect(result.current?.vat_output).toBe(450000)
      expect(result.current?.vat_payable).toBe(420000)
      expect(result.current?.revenue_excl_vat).toBe(1875000)
      expect(result.current?.net_profit_after_all_tax).toBe(1492500)
    })
  })

  describe('error handling', () => {
    it('returns null when backend responds with 503 service unavailable', async () => {
      // Deterministic pattern: count handler invocations so we know the retry-1 lifecycle
      // has settled. Hook config is `retry: 1` so backend is hit twice before final error.
      let requestCount = 0
      server.use(
        http.get(ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(
            { error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend overloaded' } },
            { status: 503 }
          )
        })
      )

      const { result } = renderHookWithClient(() => usePreliminaryTax({ from: FROM, to: TO }))

      // Wait for retry to complete: initial request + 1 retry = 2 total invocations.
      // After retries exhaust, query settles in error state → hook returns null
      // (per implementation `data?.tax ?? null`).
      await waitFor(
        () => {
          expect(requestCount).toBeGreaterThanOrEqual(2)
        },
        { timeout: 5000 }
      )
      expect(result.current).toBeNull()
    })
  })

  describe('disabled state', () => {
    it('does not fetch when enabled=false', async () => {
      // For "should NOT fetch" scenarios, we can't waitFor a positive transition.
      // Best pattern: trigger a sentinel hook in parallel that DOES fetch, then once
      // the sentinel completes we know the test framework has fully drained any
      // pending requests, so we can safely assert requestCount is still 0.
      let requestCount = 0
      let sentinelCount = 0
      server.use(
        http.get(`${API_BASE_URL}/v1/test/sentinel`, () => {
          sentinelCount += 1
          return HttpResponse.json({ ok: true })
        }),
        http.get(ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json({ tax: null })
        })
      )

      const { result } = renderHookWithClient(() =>
        usePreliminaryTax({ from: FROM, to: TO, enabled: false })
      )

      // Fire a sentinel request via fetch directly (not through the hook); when it resolves,
      // we know any synchronously-queued requests on the same MSW worker have been processed.
      await fetch(`${API_BASE_URL}/v1/test/sentinel`)
      await waitFor(() => {
        expect(sentinelCount).toBe(1)
      })

      expect(requestCount).toBe(0)
      expect(result.current).toBeNull()
    })

    it('does not fetch when from is empty', async () => {
      let requestCount = 0
      let sentinelCount = 0
      server.use(
        http.get(`${API_BASE_URL}/v1/test/sentinel`, () => {
          sentinelCount += 1
          return HttpResponse.json({ ok: true })
        }),
        http.get(ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json({ tax: null })
        })
      )

      const { result } = renderHookWithClient(() => usePreliminaryTax({ from: '', to: TO }))

      await fetch(`${API_BASE_URL}/v1/test/sentinel`)
      await waitFor(() => {
        expect(sentinelCount).toBe(1)
      })

      expect(requestCount).toBe(0)
      expect(result.current).toBeNull()
    })
  })
})
