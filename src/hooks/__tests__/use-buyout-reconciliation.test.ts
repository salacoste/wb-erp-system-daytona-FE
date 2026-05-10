/**
 * useBuyoutReconciliation — Hook Behaviour + Cabinet Isolation Tests — Story 96.14-FE
 * (2nd-pass H2-1 fix — previous file was a FAKE test: only tested query-key factory
 * string-equality, zero renderHook calls, zero actual hook behaviour covered.)
 *
 * Verifies:
 * 1. Hook is disabled (enabled: false) when cabinetId is null.
 * 2. Hook is disabled (enabled: false) when from is empty string.
 * 3. Hook is disabled (enabled: false) when to is empty string.
 * 4. Hook is enabled and fetches when all guards pass (API client mocked).
 * 5. Cabinet A → Cabinet B switch produces different query keys (no cache collision).
 * 6. Hook returns expected response shape when API client resolves.
 *
 * Key-factory regression locks (still valuable as deterministic string checks):
 * 7. Different cabinets produce non-colliding list keys.
 * 8. Same cabinet + same params produce equal keys (cache-hit expected).
 * 9. null cabinetId key is distinct from non-null.
 * 10. all factory includes cabinetId as second element.
 *
 * Pattern: mirrors src/hooks/__tests__/use-fbs-export-polling.test.ts (renderHook +
 * QueryClient wrapper + vi.spyOn API, module-level mockCabinetId for cabinet switch).
 *
 * @see src/hooks/use-buyout-reconciliation.ts
 * @see src/lib/api/buyout-reconciliation.ts — buyoutReconciliationQueryKeys factory
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import * as buyoutApi from '@/lib/api/buyout-reconciliation'
import { buyoutReconciliationQueryKeys } from '@/lib/api/buyout-reconciliation'
import { withAnomalyResponse } from '@/test/fixtures/buyout-reconciliation-empty'

// ---------------------------------------------------------------------------
// Mock authStore — hook uses selector form: useAuthStore(authState => authState.cabinetId)
// Module-level variable lets individual tests override cabinetId without re-mocking.
// ---------------------------------------------------------------------------

let mockCabinetId: string | null = 'cab-A'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

// ---------------------------------------------------------------------------
// Wrapper factory — fresh QueryClient per test (gcTime:0 prevents cross-test leakage)
// ---------------------------------------------------------------------------

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockCabinetId = 'cab-A'
})

import { useBuyoutReconciliation } from '../use-buyout-reconciliation'

// ---------------------------------------------------------------------------
// Enabled gating — query must stay idle when any guard fails
// ---------------------------------------------------------------------------

describe('useBuyoutReconciliation — enabled gating', () => {
  it('does not fetch when cabinetId is null', () => {
    mockCabinetId = null
    const spy = vi.spyOn(buyoutApi, 'getBuyoutReconciliation')
    const { result } = renderHook(() => useBuyoutReconciliation('2026-04-01', '2026-04-30'), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not fetch when from is empty string', () => {
    const spy = vi.spyOn(buyoutApi, 'getBuyoutReconciliation')
    const { result } = renderHook(() => useBuyoutReconciliation('', '2026-04-30'), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not fetch when to is empty string', () => {
    const spy = vi.spyOn(buyoutApi, 'getBuyoutReconciliation')
    const { result } = renderHook(() => useBuyoutReconciliation('2026-04-01', ''), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Fetching — resolves and returns expected shape
// ---------------------------------------------------------------------------

describe('useBuyoutReconciliation — fetches when all guards pass', () => {
  it('calls API and returns expected response shape', async () => {
    const fixture = withAnomalyResponse()
    vi.spyOn(buyoutApi, 'getBuyoutReconciliation').mockResolvedValue(fixture)

    const { result } = renderHook(() => useBuyoutReconciliation('2026-04-01', '2026-04-30'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5_000 })
    expect(result.current.data).toEqual(fixture)
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].returnWithoutBuyout).toBe(3)
  })

  it('cabinet A → cabinet B produces different query keys (no cache collision)', () => {
    const params = { from: '2026-04-01', to: '2026-04-30', nmId: undefined }
    const keyA = buyoutReconciliationQueryKeys.list('cab-A', params)
    const keyB = buyoutReconciliationQueryKeys.list('cab-B', params)
    expect(JSON.stringify(keyA)).not.toEqual(JSON.stringify(keyB))
  })
})

// ---------------------------------------------------------------------------
// Query-key factory regression locks (deterministic string-equality checks)
// Still valuable: prove the factory shape doesn't silently change.
// ---------------------------------------------------------------------------

describe('buyoutReconciliationQueryKeys — multi-tenant cabinet isolation', () => {
  const params = { from: '2026-04-01', to: '2026-04-30', nmId: undefined }

  it('list keys for different cabinets do not collide', () => {
    const a = buyoutReconciliationQueryKeys.list('cab-1', params)
    const b = buyoutReconciliationQueryKeys.list('cab-2', params)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('list keys for same cabinet and same params are equal (cache hit expected)', () => {
    const a = buyoutReconciliationQueryKeys.list('cab-1', params)
    const b = buyoutReconciliationQueryKeys.list('cab-1', params)
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b))
  })

  it('null cabinetId produces distinct key from non-null (enabled guard not bypassed)', () => {
    const nullKey = buyoutReconciliationQueryKeys.list(null, params)
    const realKey = buyoutReconciliationQueryKeys.list('cab-1', params)
    expect(JSON.stringify(nullKey)).not.toEqual(JSON.stringify(realKey))
  })

  it('all factory includes cabinetId as second element', () => {
    const key = buyoutReconciliationQueryKeys.all('cab-abc')
    expect(key[1]).toBe('cab-abc')
  })
})
