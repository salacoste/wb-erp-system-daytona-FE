/**
 * Unit tests for useMarginAnalytics hooks
 * Story 4.5: Margin Analysis by SKU
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Tests:
 * - useMarginAnalyticsBySku: API integration, data transformation
 * - useMarginAnalyticsByBrand: API integration, aggregation
 * - useMarginAnalyticsByCategory: API integration, aggregation
 * - Helper functions: getCurrentIsoWeek, formatWeekDisplay
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useMarginAnalyticsBySku,
  useMarginAnalyticsByBrand,
  useMarginAnalyticsByCategory,
  getCurrentIsoWeek,
  formatWeekDisplay,
} from './useMarginAnalytics'
import { apiClient } from '@/lib/api-client'

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMarginAnalyticsBySku', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches SKU analytics data successfully', async () => {
    const mockResponse = {
      items: [
        {
          nm_id: '123456789',
          sa_name: 'Product A',
          revenue_net: 100000,
          total_units: 50,
          cogs: 65000,
          profit: 35000,
          margin_pct: 35.0,
          markup_percent: 53.85,
          missing_cogs_flag: false,
        },
        {
          nm_id: '987654321',
          sa_name: 'Product B',
          revenue_net: 50000,
          total_units: 25,
          cogs: 40000,
          profit: 10000,
          margin_pct: 20.0,
          markup_percent: 25.0,
          missing_cogs_flag: false,
        },
      ],
      meta: {
        cursor: 'next-cursor',
        has_more: true,
      },
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsBySku({ week: '2025-W47', includeCogs: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.data).toHaveLength(2)
    expect(result.current.data?.data[0]).toMatchObject({
      nm_id: '123456789',
      sa_name: 'Product A',
      revenue_net: 100000,
      qty: 50,
      cogs: 65000,
      profit: 35000,
      margin_pct: 35.0,
      missing_cogs_flag: false,
    })
  })

  it('transforms API response correctly', async () => {
    const mockResponse = {
      items: [
        {
          nm_id: '111',
          sa_name: 'Test Product',
          revenue_net: 10000,
          total_units: 10,
          cogs: undefined,
          profit: undefined,
          margin_pct: undefined,
          missing_cogs_flag: true,
        },
      ],
      meta: {},
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsBySku({ week: '2025-W47' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].missing_cogs_flag).toBe(true)
    expect(result.current.data?.data[0].cogs).toBeUndefined()
  })

  it('handles API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(
      () => useMarginAnalyticsBySku({ week: '2025-W47' }),
      { wrapper: createWrapper() }
    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 }
    )
    expect(result.current.error).toBeDefined()
  })

  it('includes cursor and limit in query params', async () => {
    const mockResponse = { items: [], meta: {} }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    renderHook(
      () =>
        useMarginAnalyticsBySku({
          week: '2025-W47',
          cursor: 'test-cursor',
          limit: 100,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled()
      const callArgs = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(callArgs).toContain('cursor=test-cursor')
      expect(callArgs).toContain('limit=100')
    })
  })

  it('disables query when week is not provided', () => {
    const { result } = renderHook(
      () => useMarginAnalyticsBySku({ week: '' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isFetching).toBe(false)
  })
})

describe('useMarginAnalyticsByBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches brand analytics data successfully', async () => {
    const mockResponse = {
      items: [
        {
          brand: 'Brand A',
          revenue_net: 200000,
          total_units: 100,
          cogs: 130000,
          profit: 70000,
          margin_pct: 35.0,
          markup_percent: 53.85,
          missing_cogs_count: 0,
        },
      ],
      meta: {},
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsByBrand({ week: '2025-W47', includeCogs: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0]).toMatchObject({
      brand: 'Brand A',
      revenue_net: 200000,
      qty: 100,
      cogs: 130000,
      profit: 70000,
      margin_pct: 35.0,
      missing_cogs_count: 0,
    })
  })

  it('handles missing COGS count', async () => {
    const mockResponse = {
      items: [
        {
          brand: 'Brand B',
          revenue_net: 100000,
          total_units: 50,
          cogs: undefined,
          profit: undefined,
          margin_pct: undefined,
          missing_cogs_count: 25,
        },
      ],
      meta: {},
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsByBrand({ week: '2025-W47' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].missing_cogs_count).toBe(25)
  })
})

describe('useMarginAnalyticsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches category analytics data successfully', async () => {
    const mockResponse = {
      items: [
        {
          subject_name: 'Category A',
          revenue_net_rub: '150000',
          sku_count: 75,
          cogs_rub: '97500',
          profit_rub: '52500',
          margin_pct: 35.0,
          markup_percent: 53.85,
          missing_cogs_count: 0,
        },
      ],
      meta: {},
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsByCategory({ week: '2025-W47', includeCogs: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0]).toMatchObject({
      category: 'Category A',
      revenue_net: 150000,
      qty: 75,
      cogs: 97500,
      profit: 52500,
      margin_pct: 35.0,
    })
  })

  it('handles string-to-number conversion for category data', async () => {
    const mockResponse = {
      items: [
        {
          subject_name: 'Category B',
          revenue_net_rub: '50000',
          sku_count: 25,
          cogs_rub: undefined,
          profit_rub: undefined,
          margin_pct: undefined,
          missing_cogs_count: 10,
        },
      ],
      meta: {},
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useMarginAnalyticsByCategory({ week: '2025-W47' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].revenue_net).toBe(50000)
    expect(result.current.data?.data[0].cogs).toBeUndefined()
  })
})

describe('Helper Functions', () => {
  describe('getCurrentIsoWeek', () => {
    it('returns ISO week format (YYYY-Www)', () => {
      const week = getCurrentIsoWeek()
      expect(week).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('returns valid week number (01-53)', () => {
      const week = getCurrentIsoWeek()
      const weekNum = parseInt(week.split('-W')[1], 10)
      expect(weekNum).toBeGreaterThanOrEqual(1)
      expect(weekNum).toBeLessThanOrEqual(53)
    })
  })

  describe('formatWeekDisplay', () => {
    it('formats ISO week to display format', () => {
      const result = formatWeekDisplay('2025-W47')
      expect(result).toBe('Неделя 47, 2025')
    })

    it('handles week 01 correctly', () => {
      const result = formatWeekDisplay('2025-W01')
      expect(result).toBe('Неделя 1, 2025')
    })

    it('returns original string if format is invalid', () => {
      const invalid = 'invalid-week'
      const result = formatWeekDisplay(invalid)
      expect(result).toBe(invalid)
    })
  })
})

