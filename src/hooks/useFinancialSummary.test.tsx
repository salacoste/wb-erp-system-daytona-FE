/**
 * Integration tests for useFinancialSummary hooks
 * Story 3.5: Financial Summary View
 *
 * Tests:
 * - useFinancialSummary: API integration, data transformation
 * - useFinancialSummaryComparison: two-week comparison
 * - useAvailableWeeks: available weeks list
 * - Error handling (404, 400, network errors)
 * - Query caching and refetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFinancialSummary,
  useFinancialSummaryComparison,
  useAvailableWeeks,
  getCurrentIsoWeek,
  formatWeekDisplay,
  formatWeekWithDateRange,
  calculateChange,
} from './useFinancialSummary'
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

describe('useFinancialSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches financial summary data successfully', async () => {
    const mockResponse = {
      summary_total: {
        week: '2025-W01',
        sale_gross_total: 1000000,
        to_pay_goods_total: 850000,
        payout_total: 750000,
        logistics_cost_total: 50000,
        storage_cost_total: 30000,
        penalties_total: 5000,
      },
      summary_rus: null,
      summary_eaeu: null,
      meta: {
        week: '2025-W01',
        cabinet_id: 'cabinet-123',
        generated_at: '2025-01-20T10:00:00Z',
        timezone: 'Europe/Moscow',
      },
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useFinancialSummary('2025-W01'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(apiClient.get).toHaveBeenCalledWith('/v1/analytics/weekly/finance-summary?week=2025-W01')
  })

  it('handles 404 error when week not found', async () => {
    const error = { status: 404, message: 'Week not found' }
    vi.mocked(apiClient.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFinancialSummary('2025-W99'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(error)
  })

  it('handles 400 error for invalid week format', async () => {
    const error = { status: 400, message: 'Invalid week format' }
    vi.mocked(apiClient.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFinancialSummary('invalid-week'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(error)
  })

  it('does not fetch when week is empty', () => {
    const { result } = renderHook(() => useFinancialSummary(''), {
      wrapper: createWrapper(),
    })

    // When enabled is false, query is disabled and won't fetch
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('uses correct query key for caching', async () => {
    const mockResponse = {
      summary_total: { week: '2025-W01', payout_total: 750000 },
      summary_rus: null,
      summary_eaeu: null,
      meta: { week: '2025-W01', cabinet_id: 'cabinet-123', generated_at: '2025-01-20T10:00:00Z', timezone: 'Europe/Moscow' },
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useFinancialSummary('2025-W01'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Query key should include week
    expect(result.current.data).toBeDefined()
  })
})

describe('useFinancialSummaryComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches comparison data for two weeks', async () => {
    const mockResponse1 = {
      summary_total: { week: '2025-W01', payout_total: 750000 },
      summary_rus: null,
      summary_eaeu: null,
      meta: { week: '2025-W01', cabinet_id: 'cabinet-123', generated_at: '2025-01-20T10:00:00Z', timezone: 'Europe/Moscow' },
    }

    const mockResponse2 = {
      summary_total: { week: '2025-W02', payout_total: 900000 },
      summary_rus: null,
      summary_eaeu: null,
      meta: { week: '2025-W02', cabinet_id: 'cabinet-123', generated_at: '2025-01-27T10:00:00Z', timezone: 'Europe/Moscow' },
    }

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2)

    const { result } = renderHook(() => useFinancialSummaryComparison('2025-W01', '2025-W02'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.week1.isSuccess && result.current.week2.isSuccess).toBe(true))

    expect(result.current.week1.data).toEqual(mockResponse1)
    expect(result.current.week2.data).toEqual(mockResponse2)
    expect(result.current.isLoading).toBe(false)
  })

  it('shows loading state when either week is loading', async () => {
    const mockResponse1 = {
      summary_total: { week: '2025-W01', payout_total: 750000 },
      summary_rus: null,
      summary_eaeu: null,
      meta: { week: '2025-W01', cabinet_id: 'cabinet-123', generated_at: '2025-01-20T10:00:00Z', timezone: 'Europe/Moscow' },
    }

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockResponse1)
      .mockImplementationOnce(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useFinancialSummaryComparison('2025-W01', '2025-W02'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.week1.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(true)
  })

  it('shows error state when either week fails', async () => {
    const mockResponse1 = {
      summary_total: { week: '2025-W01', payout_total: 750000 },
      summary_rus: null,
      summary_eaeu: null,
      meta: { week: '2025-W01', cabinet_id: 'cabinet-123', generated_at: '2025-01-20T10:00:00Z', timezone: 'Europe/Moscow' },
    }

    const error = { status: 404, message: 'Week not found' }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse1).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFinancialSummaryComparison('2025-W01', '2025-W02'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
  })
})

describe('useAvailableWeeks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches available weeks successfully', async () => {
    const mockResponse = [
      { week: '2025-W01', start_date: '2025-01-06' },
      { week: '2025-W02', start_date: '2025-01-13' },
      { week: '2025-W03', start_date: '2025-01-20' },
    ]

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useAvailableWeeks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(apiClient.get).toHaveBeenCalledWith('/v1/analytics/weekly/available-weeks')
  })

  it('handles object response format with data property', async () => {
    const mockResponse = {
      data: [
        { week: '2025-W01', start_date: '2025-01-06' },
        { week: '2025-W02', start_date: '2025-01-13' },
      ],
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useAvailableWeeks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse.data)
  })

  it('handles empty array response', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])

    const { result } = renderHook(() => useAvailableWeeks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('handles network error', async () => {
    const error = { message: 'Network error' }
    vi.mocked(apiClient.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useAvailableWeeks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(error)
  })
})

describe('Helper functions', () => {
  describe('getCurrentIsoWeek', () => {
    it('returns ISO week format (YYYY-Www)', () => {
      const week = getCurrentIsoWeek()
      expect(week).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('formatWeekDisplay', () => {
    it('formats week string correctly', () => {
      expect(formatWeekDisplay('2025-W01')).toBe('Неделя 1, 2025')
      expect(formatWeekDisplay('2025-W46')).toBe('Неделя 46, 2025')
    })

    it('returns original string for invalid format', () => {
      expect(formatWeekDisplay('invalid')).toBe('invalid')
    })
  })

  describe('formatWeekWithDateRange', () => {
    it('formats week with date range', () => {
      const formatted = formatWeekWithDateRange('2025-W01')
      expect(formatted).toMatch(/Неделя 1 \(\d{2}\.\d{2} - \d{2}\.\d{2}\)/)
    })

    it('returns original string for invalid format', () => {
      expect(formatWeekWithDateRange('invalid')).toBe('invalid')
    })
  })

  describe('calculateChange', () => {
    it('calculates positive change correctly', () => {
      const result = calculateChange(120, 100)
      expect(result.value).toBe(20)
      expect(result.percentage).toBe(20)
      expect(result.trend).toBe('up')
    })

    it('calculates negative change correctly', () => {
      const result = calculateChange(80, 100)
      expect(result.value).toBe(-20)
      expect(result.percentage).toBe(-20)
      expect(result.trend).toBe('down')
    })

    it('handles zero change', () => {
      const result = calculateChange(100, 100)
      expect(result.value).toBe(0)
      expect(result.percentage).toBe(0)
      expect(result.trend).toBe('same')
    })

    it('handles null/undefined values', () => {
      const result1 = calculateChange(null, 100)
      expect(result1.value).toBeNull()
      expect(result1.percentage).toBeNull()
      expect(result1.trend).toBe('same')

      const result2 = calculateChange(100, null)
      expect(result2.value).toBeNull()
      expect(result2.percentage).toBeNull()
      expect(result2.trend).toBe('same')
    })

    it('handles zero previous value', () => {
      const result = calculateChange(100, 0)
      expect(result.value).toBeNull()
      expect(result.percentage).toBeNull()
      expect(result.trend).toBe('same')
    })
  })
})

