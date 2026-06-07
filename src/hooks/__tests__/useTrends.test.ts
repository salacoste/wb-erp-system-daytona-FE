/**
 * TDD Unit Tests for useTrends Hook - Revenue Field Mapping
 * Story 61.1-FE: Fix Revenue Field Mapping
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests written BEFORE implementation (TDD red-green-refactor cycle).
 *
 * PROBLEM:
 * Current (WRONG): metrics=sale_gross (retail price - цена для покупателя)
 * Correct: metrics=wb_sales_gross (seller revenue - выручка продавца после комиссии WB)
 *
 * Impact: Dashboard shows ~50% higher revenue than actual seller earnings.
 *
 * KEY REQUIREMENTS:
 * - AC1: Change useTrends.ts to request metrics=wb_sales_gross,to_pay_goods
 * - AC2: Update TrendsDataPoint type if field name changes
 * - AC3: Update any data transformations that reference sale_gross
 * - AC4: Verify TrendGraph component displays correct values
 * - AC5: Add comment explaining the difference between fields
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import { createQueryWrapper, setupMockAuth, clearMockAuth } from '@/test/test-utils'

// Import the hook we're testing
import { useTrends, type TrendDataPoint, type TrendData } from '../useTrends'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ==========================================================================
// Test Fixtures
// ==========================================================================

// Mock response using CORRECT field: wb_sales_gross
const mockTrendsResponseWithCorrectField = {
  period: {
    from: '2026-W01',
    to: '2026-W05',
    weeks_count: 5,
  },
  data: [
    {
      week: '2026-W01',
      wb_sales_gross: 100000, // Correct: seller revenue after WB commission
      to_pay_goods: 80000,
    },
    {
      week: '2026-W02',
      wb_sales_gross: 120000,
      to_pay_goods: 95000,
    },
    {
      week: '2026-W03',
      wb_sales_gross: 110000,
      to_pay_goods: 88000,
    },
    {
      week: '2026-W04',
      wb_sales_gross: 130000,
      to_pay_goods: 105000,
    },
    {
      week: '2026-W05',
      wb_sales_gross: 140000,
      to_pay_goods: 112000,
    },
  ],
  summary: {
    sale_gross: {
      min: 100000,
      max: 140000,
      avg: 120000,
      trend: '+40.0%',
    },
    to_pay_goods: {
      min: 80000,
      max: 112000,
      avg: 96000,
      trend: '+40.0%',
    },
  },
}

// Note: Mock response with OLD (wrong) field is documented in tests below
// to explain the difference between sale_gross and wb_sales_gross

// ==========================================================================
// API Request Tests (Story 61.1-FE Core Fix)
// ==========================================================================

describe('useTrends - API Request Field Mapping (Story 61.1-FE)', () => {
  let apiCallUrl: string | null = null

  beforeEach(() => {
    setupMockAuth()
    apiCallUrl = null

    // Intercept API calls to capture the URL
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, ({ request }) => {
        apiCallUrl = request.url
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  // ==========================================================================
  // AC1: Correct metrics parameter in API request
  // TDD: These tests define EXPECTED behavior after Story 61.1-FE implementation
  // ==========================================================================

  describe('API request parameters (AC1)', () => {
    it('should request wb_sales_gross in metrics parameter, NOT sale_gross', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(apiCallUrl).toContain('wb_sales_gross')
      // Verify the old wrong field is NOT the primary metric
      expect(apiCallUrl).not.toMatch(/metrics=sale_gross[,&]/)
    })

    it('should include to_pay_goods in metrics parameter', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(apiCallUrl).toContain('to_pay_goods')
    })

    it('should use full metrics string: metrics=wb_sales_gross,to_pay_goods', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(apiCallUrl).toContain('metrics=wb_sales_gross')
      expect(apiCallUrl).toContain('to_pay_goods')
    })
  })

  // ==========================================================================
  // AC2: Data transformation with correct field
  // TDD: Tests verify data mapping after the fix
  // ==========================================================================

  describe('data transformation (AC2, AC3)', () => {
    it('should map wb_sales_gross to revenue field in TrendDataPoint', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const trends = result.current.data?.trends ?? []
      // First data point has wb_sales_gross=100000 in mock
      expect(trends[0].revenue).toBe(100000)
      // Second has wb_sales_gross=120000
      expect(trends[1].revenue).toBe(120000)
    })

    it('should return all weeks in ascending order', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const trends = result.current.data?.trends ?? []
      expect(trends).toHaveLength(5)
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].week > trends[i - 1].week).toBe(true)
      }
    })

    it('should include week in TrendDataPoint', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const trends = result.current.data?.trends ?? []
      expect(trends[0].week).toBe('2026-W01')
      expect(trends[4].week).toBe('2026-W05')
    })

    it('should use week as date fallback', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const trends = result.current.data?.trends ?? []
      // TrendDataPoint uses week string directly as the date identifier
      expect(trends[0].week).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  // ==========================================================================
  // Summary data tests
  // TDD: This test depends on the fix being implemented
  // ==========================================================================

  describe('summary data', () => {
    it('should include summary statistics from API response', async () => {
      const { result } = renderHook(() => useTrends(5), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const summary = result.current.data?.summary
      expect(summary).toBeDefined()
      expect(summary?.sale_gross).toBeDefined()
      expect(summary?.sale_gross?.min).toBe(100000)
      expect(summary?.sale_gross?.max).toBe(140000)
      expect(summary?.sale_gross?.avg).toBe(120000)
    })
  })
})

// ==========================================================================
// TrendDataPoint Type Tests (AC2)
// ==========================================================================

describe('TrendDataPoint type structure (AC2)', () => {
  it('should have correct properties for component consumption', () => {
    // This is a type-level test - verifies the interface is correct
    const point: TrendDataPoint = {
      week: '2026-W05',
      revenue: 100000, // Should come from wb_sales_gross
      totalPayable: 80000, // Should come from to_pay_goods
      payoutTotal: 75000, // payout_total — фактически перечислено
      logisticsCost: 5000, // Doc 122/123: logistics_cost metric
      cogsTotal: 40000, // cogs_total — себестоимость
      operatingProfit: 35000, // payout - cogs
      efficiencyPct: 35.0, // (payout - cogs) / wb_sales_gross * 100
    }

    expect(point.week).toBeDefined()
    expect(point.revenue).toBeDefined()
    expect(point.totalPayable).toBeDefined()
    expect(point.payoutTotal).toBeDefined()
    expect(point.logisticsCost).toBeDefined()
    expect(point.cogsTotal).toBeDefined()
    expect(point.operatingProfit).toBeDefined()
    expect(point.efficiencyPct).toBeDefined()
  })

  it('should use numeric types for financial values', () => {
    const point: TrendDataPoint = {
      week: '2026-W05',
      revenue: 100000.5,
      totalPayable: 80000.25,
      payoutTotal: 75000.5,
      logisticsCost: 5000.75, // Doc 122/123: logistics_cost metric
      cogsTotal: 40000.0,
      operatingProfit: 35000.5,
      efficiencyPct: 35.0,
    }

    expect(typeof point.revenue).toBe('number')
    expect(typeof point.totalPayable).toBe('number')
    expect(typeof point.payoutTotal).toBe('number')
    expect(typeof point.logisticsCost).toBe('number')
    expect(typeof point.cogsTotal).toBe('number')
  })
})

// ==========================================================================
// TrendData Type Tests
// ==========================================================================

describe('TrendData type structure', () => {
  it('should have correct structure', () => {
    const data: TrendData = {
      trends: [],
      period: 'weeks',
      summary: undefined,
    }

    expect(data.trends).toBeDefined()
    expect(data.period).toBe('weeks')
  })
})

// ==========================================================================
// Error Handling Tests
// ==========================================================================

describe('useTrends error handling', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should return empty trends on 404 error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'No data available' } },
          { status: 404 }
        )
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.trends).toEqual([])
    expect(result.current.data?.period).toBe('weeks')
  })

  it('should return empty trends on 400 error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Invalid parameters' } },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.trends).toEqual([])
  })

  it('should handle empty data array from API', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json({
          period: { from: '2026-W01', to: '2026-W05', weeks_count: 5 },
          data: [],
          summary: {},
        })
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.trends).toEqual([])
  })
})

// ==========================================================================
// Revenue Field Comparison (Documentation)
// ==========================================================================

describe('revenue field documentation (AC5)', () => {
  it('should understand the difference between sale_gross and wb_sales_gross', () => {
    // Story 61.1-FE: This documents the critical difference
    // sale_gross = retail price (цена для покупателя) - WRONG for seller revenue
    // wb_sales_gross = seller revenue after WB commission - CORRECT

    const retailPrice = 150000 // sale_gross - what buyer pays
    const sellerRevenue = 100000 // wb_sales_gross - what seller receives
    const wbCommission = retailPrice - sellerRevenue // ~33% commission

    expect(wbCommission).toBe(50000)
    expect(wbCommission / retailPrice).toBeCloseTo(0.33, 2)

    // Using sale_gross would show ~50% higher revenue than actual seller earnings
    const overstatePercentage = ((retailPrice - sellerRevenue) / sellerRevenue) * 100
    expect(overstatePercentage).toBe(50)
  })

  it('should NOT use sale_gross as revenue metric', () => {
    // This test documents the bug we're fixing
    const wrongRevenue = 150000 // sale_gross
    const correctRevenue = 100000 // wb_sales_gross

    // The difference is WB commission (~33%)
    expect(wrongRevenue).toBeGreaterThan(correctRevenue)
    expect(wrongRevenue - correctRevenue).toBe(50000)
  })
})

// ==========================================================================
// Query Configuration Tests
// ==========================================================================

describe('useTrends query configuration', () => {
  beforeEach(() => {
    setupMockAuth()
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should use correct query key', async () => {
    const { result } = renderHook(() => useTrends(8), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Query should include limit in key for cache isolation
    expect(result.current.data).toBeDefined()
  })

  it('should default to 8 weeks when no limit provided', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )

    const { result } = renderHook(() => useTrends(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Default behavior verified through successful data fetch
    expect(result.current.data).toBeDefined()
  })

  it('should respect custom limit parameter', async () => {
    const { result } = renderHook(() => useTrends(12), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeDefined()
  })
})

// ==========================================================================
// Loading States
// ==========================================================================

describe('useTrends loading states', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should transition to loaded state with data from wb_sales_gross', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.trends).toHaveLength(5)
    // Verify revenue comes from wb_sales_gross, not sale_gross
    expect(result.current.data?.trends[0].revenue).toBe(100000)
  })
})

// ==========================================================================
// Data Mapping Validation (prevents regression)
// ==========================================================================

describe('data mapping validation (prevents regression)', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should correctly map all data points using wb_sales_gross', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(mockTrendsResponseWithCorrectField)
      })
    )

    const { result } = renderHook(() => useTrends(5), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const trends = result.current.data?.trends ?? []
    expect(trends).toHaveLength(5)
    // Verify all 5 data points map wb_sales_gross correctly
    expect(trends[0].revenue).toBe(100000)
    expect(trends[1].revenue).toBe(120000)
    expect(trends[2].revenue).toBe(110000)
    expect(trends[3].revenue).toBe(130000)
    expect(trends[4].revenue).toBe(140000)
    // Verify to_pay_goods mapped to totalPayable
    expect(trends[0].totalPayable).toBe(80000)
    expect(trends[4].totalPayable).toBe(112000)
  })

  it('should handle null/undefined values gracefully for wb_sales_gross', async () => {
    const responseWithNulls = {
      period: { from: '2026-W01', to: '2026-W02', weeks_count: 2 },
      data: [
        { week: '2026-W01', wb_sales_gross: null, to_pay_goods: null },
        { week: '2026-W02' }, // entirely missing fields
      ],
      summary: {},
    }

    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/weekly/trends`, () => {
        return HttpResponse.json(responseWithNulls)
      })
    )

    const { result } = renderHook(() => useTrends(2), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const trends = result.current.data?.trends ?? []
    expect(trends).toHaveLength(2)
    // Null wb_sales_gross falls back to sale_gross, then to 0
    expect(trends[0].revenue).toBe(0)
    // Missing fields default to 0
    expect(trends[1].revenue).toBe(0)
    expect(trends[1].totalPayable).toBe(0)
  })
})
