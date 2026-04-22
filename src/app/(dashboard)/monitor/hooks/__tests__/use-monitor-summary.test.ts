/**
 * Unit tests for useMonitorSummary — Story 92.1-FE
 * Pattern: renderHook + real authStore (useAuthStore.setState) for selector compat.
 * See src/hooks/__tests__/useClientInfo.test.ts for canonical selector-hook test style.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/lib/api/monitor-summary', () => ({
  getMonitorSummary: vi.fn(),
  monitorSummaryQueryKeys: {
    all: ['monitor-summary'],
    byCabinet: (cabinetId: string) => ['monitor-summary', cabinetId] as const,
  },
}))

import { getMonitorSummary } from '@/lib/api/monitor-summary'
import { useMonitorSummary } from '../use-monitor-summary'

const mockedGetMonitorSummary = vi.mocked(getMonitorSummary)

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const MOCK_RESPONSE = {
  periods: {
    today: {
      salesCount: 5,
      returnsCount: 1,
      revenue: 25000,
      cogs: 15000,
      expenses: 2000,
      advertisingSpend: 1000,
      margin: 7000,
    },
    yesterday: {
      salesCount: 8,
      returnsCount: 0,
      revenue: 40000,
      cogs: 24000,
      expenses: 3000,
      advertisingSpend: 1500,
      margin: 11500,
    },
    last30Days: {
      salesCount: 120,
      returnsCount: 10,
      revenue: 600000,
      cogs: null,
      expenses: 50000,
      advertisingSpend: 30000,
      margin: null,
    },
    prev30Days: {
      salesCount: 100,
      returnsCount: 8,
      revenue: 500000,
      cogs: 300000,
      expenses: 40000,
      advertisingSpend: 25000,
      margin: 135000,
    },
  },
  kpi: {
    totalProducts: 200,
    productsWithCogs: 150,
    cogsCoveragePercent: 75.0,
    buyoutRatePercent: 68.5,
    lastSyncAt: '2026-04-21T10:00:00Z',
  },
  generatedAt: '2026-04-21T10:05:00Z',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setAuthCabinet(cabinetId: string | null) {
  useAuthStore.setState({ cabinetId })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

afterEach(() => {
  useAuthStore.setState({ cabinetId: null })
})

describe('useMonitorSummary', () => {
  it('returns data when cabinetId is set and API resolves with normalized shape', async () => {
    setAuthCabinet('test-cabinet')
    mockedGetMonitorSummary.mockResolvedValueOnce(MOCK_RESPONSE)

    const { result } = renderHook(() => useMonitorSummary(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetMonitorSummary).toHaveBeenCalledWith('test-cabinet')
    expect(result.current.data?.kpi.totalProducts).toBe(200)
    expect(result.current.data?.periods.today.salesCount).toBe(5)
    expect(result.current.data?.generatedAt).toBe('2026-04-21T10:05:00Z')
  })

  it('is disabled when cabinetId is null — API is never called', () => {
    setAuthCabinet(null)

    const { result } = renderHook(() => useMonitorSummary(), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetMonitorSummary).not.toHaveBeenCalled()
  })

  it('propagates null values in response data through to the hook consumer', async () => {
    setAuthCabinet('cabinet-xyz')
    const responseWithNull = {
      ...MOCK_RESPONSE,
      periods: {
        ...MOCK_RESPONSE.periods,
        today: { ...MOCK_RESPONSE.periods.today, revenue: null },
      },
    }
    mockedGetMonitorSummary.mockResolvedValueOnce(responseWithNull)

    const { result } = renderHook(() => useMonitorSummary(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.periods.today.revenue).toBeNull()
  })

  it('is disabled when the enabled arg is false, regardless of cabinetId', () => {
    setAuthCabinet('cabinet-abc')

    const { result } = renderHook(() => useMonitorSummary(false), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetMonitorSummary).not.toHaveBeenCalled()
  })
})
