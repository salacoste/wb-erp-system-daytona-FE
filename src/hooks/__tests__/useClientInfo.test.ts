/**
 * Tests for useClientInfo hook — Story 86.2
 *
 * 🚨 PRIVACY GUARDRAIL TESTS:
 * AC #4 — no console logging of PII payloads
 * AC #5 — gcTime: 0 + storage cleanliness after unmount
 * AC #6 — chunking for >100 orderIds
 * AC #2 — non-Owner role gate
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '@/test/test-utils'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'
import {
  useClientInfo,
  clientInfoQueryKeys,
  chunkOrderIds,
  buildClientInfoMap,
} from '../useClientInfo'

vi.mock('@/lib/api/orders/client-info-api', () => ({
  getClientInfo: vi.fn(),
  CLIENT_INFO_MAX_BATCH: 100,
}))

import { getClientInfo } from '@/lib/api/orders/client-info-api'

const setUserRole = (role: 'Owner' | 'Manager' | 'Analyst' | 'Service' | null): void => {
  useAuthStore.setState({
    user: role ? { id: 'u1', email: 't@t', role, cabinet_ids: ['cab-1'] } : null,
    cabinetId: 'cab-1',
    isAuthenticated: !!role,
    token: role ? 'jwt-token' : null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Clean both storages between tests so PII assertions are unambiguous
  if (typeof localStorage !== 'undefined') localStorage.clear()
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
})

afterEach(() => {
  useAuthStore.setState({ user: null, cabinetId: null, isAuthenticated: false, token: null })
})

// ============================================================================
// Pure helper tests (chunking, map building, query keys)
// ============================================================================

describe('chunkOrderIds', () => {
  it('returns single chunk when input <= 100', () => {
    expect(chunkOrderIds(['1', '2', '3'])).toEqual([['1', '2', '3']])
  })

  it('returns empty array when input is empty', () => {
    expect(chunkOrderIds([])).toEqual([])
  })

  it('splits 250 ids into chunks of 100, 100, 50', () => {
    const ids = Array.from({ length: 250 }, (_, i) => String(i + 1))
    const chunks = chunkOrderIds(ids)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(100)
    expect(chunks[1]).toHaveLength(100)
    expect(chunks[2]).toHaveLength(50)
  })

  it('returns single chunk of exactly 100 when input is 100', () => {
    const ids = Array.from({ length: 100 }, (_, i) => String(i + 1))
    expect(chunkOrderIds(ids)).toHaveLength(1)
  })

  it('contract: empty input returns empty array (L4 — defensive guarantee)', () => {
    // This path is unreachable in production because the hook is enabled: false
    // when orderIds.length === 0, but the contract is documented and tested.
    expect(chunkOrderIds([])).toEqual([])
    expect(chunkOrderIds([])).toHaveLength(0)
  })
})

describe('buildClientInfoMap', () => {
  it('keys map by stringified orderId', () => {
    const map = buildClientInfoMap([[{ orderId: 123, clientName: 'A', clientPhone: '+71' }]])
    expect(map['123']).toEqual({ orderId: 123, clientName: 'A', clientPhone: '+71' })
  })

  it('merges multiple responses into one map', () => {
    const map = buildClientInfoMap([
      [{ orderId: 1, clientName: 'A' }],
      [{ orderId: 2, clientName: 'B' }],
      [{ orderId: 3, clientName: 'C' }],
    ])
    expect(Object.keys(map)).toEqual(['1', '2', '3'])
  })

  it('handles empty responses gracefully', () => {
    expect(buildClientInfoMap([])).toEqual({})
    expect(buildClientInfoMap([[]])).toEqual({})
  })

  it('overwrites earlier entries when same orderId appears in later chunk', () => {
    const map = buildClientInfoMap([
      [{ orderId: 1, clientName: 'first' }],
      [{ orderId: 1, clientName: 'second' }],
    ])
    expect(map['1'].clientName).toBe('second')
  })
})

describe('clientInfoQueryKeys', () => {
  it('produces stable key for same orderIds in different order', () => {
    const a = clientInfoQueryKeys.byOrderIds(['3', '1', '2'])
    const b = clientInfoQueryKeys.byOrderIds(['1', '2', '3'])
    expect(a).toEqual(b)
  })

  it('does not mutate input array', () => {
    const input = ['3', '1', '2']
    clientInfoQueryKeys.byOrderIds(input)
    expect(input).toEqual(['3', '1', '2'])
  })
})

// ============================================================================
// Role gating tests (AC #2)
// ============================================================================

describe('useClientInfo — role gate (AC #2)', () => {
  it('does NOT fetch when user is null', () => {
    setUserRole(null)
    const { result } = renderHookWithClient(() => useClientInfo(['1', '2']))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })

  it('does NOT fetch when user role is Manager', () => {
    setUserRole('Manager')
    const { result } = renderHookWithClient(() => useClientInfo(['1', '2']))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })

  it('does NOT fetch when user role is Analyst', () => {
    setUserRole('Analyst')
    const { result } = renderHookWithClient(() => useClientInfo(['1', '2']))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })

  it('does NOT fetch when user role is Service', () => {
    setUserRole('Service')
    const { result } = renderHookWithClient(() => useClientInfo(['1', '2']))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })

  it('does NOT fetch when orderIds is empty (even for Owner)', () => {
    setUserRole('Owner')
    const { result } = renderHookWithClient(() => useClientInfo([]))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })

  it('does NOT fetch when cabinetId is null (even for Owner)', () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 't', role: 'Owner', cabinet_ids: [] },
      cabinetId: null,
      isAuthenticated: true,
      token: 'jwt',
    })
    const { result } = renderHookWithClient(() => useClientInfo(['1']))
    expect(result.current.isFetching).toBe(false)
    expect(getClientInfo).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Success path + chunking tests (AC #1, #6)
// ============================================================================

describe('useClientInfo — success path', () => {
  beforeEach(() => setUserRole('Owner'))

  it('fetches and returns merged ClientInfoMap for Owner', async () => {
    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'Иван И.', clientPhone: '+7999***1234' },
      { orderId: 200, clientName: 'Мария П.', clientPhone: '+7999***5678' },
    ])

    const { result } = renderHookWithClient(() => useClientInfo(['100', '200']))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      '100': { orderId: 100, clientName: 'Иван И.', clientPhone: '+7999***1234' },
      '200': { orderId: 200, clientName: 'Мария П.', clientPhone: '+7999***5678' },
    })
    expect(getClientInfo).toHaveBeenCalledTimes(1)
    expect(getClientInfo).toHaveBeenCalledWith('cab-1', ['100', '200'])
  })

  it('chunks 250 orderIds into 3 parallel calls (AC #6)', async () => {
    vi.mocked(getClientInfo).mockResolvedValue([])
    const ids = Array.from({ length: 250 }, (_, i) => String(i + 1))

    const { result } = renderHookWithClient(() => useClientInfo(ids))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getClientInfo).toHaveBeenCalledTimes(3)
    expect(vi.mocked(getClientInfo).mock.calls[0][1]).toHaveLength(100)
    expect(vi.mocked(getClientInfo).mock.calls[1][1]).toHaveLength(100)
    expect(vi.mocked(getClientInfo).mock.calls[2][1]).toHaveLength(50)
  })

  it('handles partial response — orders missing from API absent from map (AC #3)', async () => {
    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'Иван И.' },
      // 200 missing from response
    ])

    const { result } = renderHookWithClient(() => useClientInfo(['100', '200']))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      '100': { orderId: 100, clientName: 'Иван И.' },
    })
    expect(result.current.data?.['200']).toBeUndefined()
  })

  it('does NOT retry on error (retry: false)', async () => {
    vi.mocked(getClientInfo).mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getClientInfo).toHaveBeenCalledTimes(1)
  })

  it('propagates 503 rate limit error without retry (G2 — testarch gap)', async () => {
    // Backend test-api/03-cabinets.http documents 503 with "Rate limit exceeded. Retry after 60s"
    // for the WB Orders FBW upstream rate limit. Hook should propagate but NOT auto-retry.
    // Use the project's ApiError class so the mock matches what real code throws
    // (allows downstream `if (err instanceof ApiError)` checks to work).
    const rateLimitError = new ApiError('Rate limit exceeded. Retry after 60s', 503)
    vi.mocked(getClientInfo).mockRejectedValueOnce(rateLimitError)

    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(getClientInfo).toHaveBeenCalledTimes(1) // no retry
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error?.message).toContain('Rate limit')
    expect(result.current.data).toBeUndefined()
  })
})

// ============================================================================
// 🚨 PRIVACY GUARDRAIL TESTS (AC #4, #5)
// ============================================================================

describe('useClientInfo — privacy guardrails (AC #4, #5)', () => {
  beforeEach(() => setUserRole('Owner'))

  it('does NOT log PII to any console method on success (AC #4)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'SECRET_NAME', clientPhone: 'SECRET_PHONE' },
    ])

    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Assert NO console call ever received the PII strings as arguments
    const allConsoleCalls = [
      ...infoSpy.mock.calls,
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ].flat()
    const serialized = JSON.stringify(allConsoleCalls)
    expect(serialized).not.toContain('SECRET_NAME')
    expect(serialized).not.toContain('SECRET_PHONE')

    infoSpy.mockRestore()
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('does NOT log PII to console.error on FAILED requests (AC #4 — error path)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Simulate a backend error whose message accidentally contains PII (worst case)
    vi.mocked(getClientInfo).mockRejectedValueOnce(
      new Error('Backend error referencing PII_ERR_NAME')
    )

    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isError).toBe(true))

    // The hook itself must not log the error — TanStack Query may also log,
    // but our hook's source has zero console calls, so we check OUR module did
    // not amplify the leak by adding extra log statements with the error body.
    const ourCalls = JSON.stringify([...infoSpy.mock.calls.flat(), ...errorSpy.mock.calls.flat()])
    // The hook never logs the error directly. TanStack Query's internal logger
    // is not in scope; our guarantee is "this module does not log PII".
    // Assert error was at least not echoed via console.info from our code.
    expect(infoSpy).not.toHaveBeenCalled()
    // Sanity probe: the test setup itself did not contaminate the spy with PII.
    if (ourCalls.includes('PII_ERR_NAME')) {
      // Only fail if the test environment somehow logged it via our calls.
      throw new Error('Hook leaked PII via console')
    }

    errorSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it('does NOT persist PII to localStorage after success (AC #5)', async () => {
    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'PII_NAME_LS', clientPhone: 'PII_PHONE_LS' },
    ])

    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Inspect every key/value in localStorage for any PII leakage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = key ? localStorage.getItem(key) : null
      expect(key ?? '').not.toContain('PII_NAME_LS')
      expect(key ?? '').not.toContain('PII_PHONE_LS')
      expect(value ?? '').not.toContain('PII_NAME_LS')
      expect(value ?? '').not.toContain('PII_PHONE_LS')
    }
  })

  it('does NOT persist PII to sessionStorage after success (AC #5)', async () => {
    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'PII_NAME_SS', clientPhone: 'PII_PHONE_SS' },
    ])

    const { result } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      const value = key ? sessionStorage.getItem(key) : null
      expect(key ?? '').not.toContain('PII_NAME_SS')
      expect(key ?? '').not.toContain('PII_PHONE_SS')
      expect(value ?? '').not.toContain('PII_NAME_SS')
      expect(value ?? '').not.toContain('PII_PHONE_SS')
    }
  })

  it('PII is not in storage after hook unmounts (gcTime: 0 — AC #5)', async () => {
    vi.mocked(getClientInfo).mockResolvedValueOnce([
      { orderId: 100, clientName: 'UNMOUNT_NAME', clientPhone: 'UNMOUNT_PHONE' },
    ])

    const { result, unmount } = renderHookWithClient(() => useClientInfo(['100']))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    unmount()

    // Sweep both storages exhaustively
    const leakageProbe = (storage: Storage): boolean => {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        const v = k ? storage.getItem(k) : ''
        if ((k ?? '').includes('UNMOUNT_') || (v ?? '').includes('UNMOUNT_')) return true
      }
      return false
    }
    expect(leakageProbe(localStorage)).toBe(false)
    expect(leakageProbe(sessionStorage)).toBe(false)
  })
})
