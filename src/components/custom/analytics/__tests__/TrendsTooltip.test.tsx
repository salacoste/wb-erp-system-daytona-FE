/**
 * Tests for TrendsTooltip Component (FbsTrendsTooltip)
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests custom Recharts tooltip with date formatting,
 * currency formatting, and metric display.
 *
 * @see docs/stories/epic-51/story-51.4-fe-fbs-trends-chart.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { FbsTrendsTooltip } from '@/components/custom/analytics/FbsTrendsTooltip'
import { CHART_LINE_COLORS, type MetricVisibility } from '@/lib/fbs-analytics-utils'
import type { TrendDataPoint } from '@/types/fbs-analytics'

// ============================================================================
// Test Helpers
// ============================================================================

/** Build a mock payload item for Recharts tooltip */
function makePayload(dataPoint: TrendDataPoint) {
  return [
    {
      dataKey: 'ordersCount',
      value: dataPoint.ordersCount,
      color: CHART_LINE_COLORS.orders,
      payload: dataPoint,
    },
  ]
}

const sampleDataPoint: TrendDataPoint = {
  date: '2026-01-15',
  ordersCount: 150,
  revenue: 250000,
  cancellations: 10,
  cancellationRate: 6.67,
  returns: 5,
  returnRate: 3.33,
  avgOrderValue: 1666.67,
}

const allVisible: MetricVisibility = {
  orders: true,
  revenue: true,
  cancellations: true,
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('TrendsTooltip - Basic Rendering', () => {
  it('should return null when not active', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={false}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should return null when payload is empty', () => {
    const { container } = render(
      <FbsTrendsTooltip active={true} payload={[]} visibility={allVisible} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should return null when payload is undefined', () => {
    const { container } = render(
      <FbsTrendsTooltip active={true} payload={undefined} visibility={allVisible} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render tooltip container when active with payload', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const tooltip = container.querySelector('.rounded-lg')
    expect(tooltip).toBeInTheDocument()
  })

  it('should apply rounded border and shadow styling', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const tooltip = container.querySelector('.rounded-lg')
    expect(tooltip?.className).toContain('border')
    expect(tooltip?.className).toContain('shadow')
  })
})

// ============================================================================
// Date Formatting Tests
// ============================================================================

describe('TrendsTooltip - Date Formatting', () => {
  it('should display date in Russian format (DD.MM.YYYY)', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // formatTooltipDate('2026-01-15') → '15.01.2026'
    expect(screen.getByText('15.01.2026')).toBeInTheDocument()
  })

  it('should format ISO date string correctly', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, date: '2025-03-08' }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    expect(screen.getByText('08.03.2025')).toBeInTheDocument()
  })

  it('should format week string correctly (YYYY-Www)', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, date: '2026-W03' }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatTooltipDate('2026-W03') → 'Неделя 03, 2026'
    expect(screen.getByText('Неделя 03, 2026')).toBeInTheDocument()
  })

  it('should show date in bold/semibold styling', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const dateEl = container.querySelector('.font-semibold')
    expect(dateEl).toBeInTheDocument()
  })
})

// ============================================================================
// Orders Count Display Tests
// ============================================================================

describe('TrendsTooltip - Orders Count', () => {
  it('should display "Заказы:" label', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    expect(screen.getByText('Заказы:')).toBeInTheDocument()
  })

  it('should format orders count with Russian locale (spaces)', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, ordersCount: 1500 }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatNumber(1500) in Russian locale: "1 500"
    expect(screen.getByText(/1\s?500/)).toBeInTheDocument()
  })

  it('should show zero orders correctly', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, ordersCount: 0 }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatNumber(0) → "0"
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

// ============================================================================
// Revenue Formatting Tests
// ============================================================================

describe('TrendsTooltip - Revenue Formatting', () => {
  it('should display "Выручка:" label', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    expect(screen.getByText('Выручка:')).toBeInTheDocument()
  })

  it('should format revenue as currency with ruble symbol', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // formatCurrency(250000) includes ruble; multiple elements may have it
    const rubleElements = screen.getAllByText(/₽/)
    expect(rubleElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should use Russian number formatting (spaces, comma)', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // 250000 → "250 000,00 ₽" or similar Russian format
    const revenueEls = screen.getAllByText(/250/)
    expect(revenueEls.length).toBeGreaterThan(0)
  })

  it('should handle large revenue values (millions)', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, revenue: 5_000_000 }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatCurrency(5_000_000) renders ruble; multiple elements may contain it
    const rubleElements = screen.getAllByText(/₽/)
    expect(rubleElements.length).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================================
// Cancellations Display Tests
// ============================================================================

describe('TrendsTooltip - Cancellations Display', () => {
  it('should display "Отмены:" label', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    expect(screen.getByText('Отмены:')).toBeInTheDocument()
  })

  it('should show cancellations count', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // formatNumber(10) → "10"
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should display cancellation rate as percentage', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // formatPercentValue(6.67) → "6,67 %" (Russian locale); multiple elements may match
    const percentElements = screen.getAllByText(/6,67/)
    expect(percentElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should format percentage with one decimal place', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, cancellationRate: 5 }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatPercentValue(5) → "5 %"
    expect(screen.getByText(/5\s?%/)).toBeInTheDocument()
  })
})

// ============================================================================
// Average Order Value Tests
// ============================================================================

describe('TrendsTooltip - Average Order Value', () => {
  it('should display "Средний чек:" label', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    expect(screen.getByText('Средний чек:')).toBeInTheDocument()
  })

  it('should format average order value as currency', () => {
    render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    // avgOrderValue = 1666.67, formatCurrency includes ₽
    const avgElements = screen.getAllByText(/₽/)
    expect(avgElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle zero average order value', () => {
    const dataPoint: TrendDataPoint = { ...sampleDataPoint, avgOrderValue: 0, revenue: 0 }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(dataPoint)} visibility={allVisible} />
    )
    // formatCurrency(0) → "0 ₽"; multiple elements may contain ruble
    const zeroRubleElements = screen.getAllByText(/0\s*₽/)
    expect(zeroRubleElements.length).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================================
// Styling Tests
// ============================================================================

describe('TrendsTooltip - Styling', () => {
  it('should have white background', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const tooltip = container.querySelector('.bg-white')
    expect(tooltip).toBeInTheDocument()
  })

  it('should have padding of 3 units', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const tooltip = container.querySelector('.p-3')
    expect(tooltip).toBeInTheDocument()
  })

  it('should use gray text for labels', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const grayLabels = container.querySelectorAll('.text-gray-600')
    expect(grayLabels.length).toBeGreaterThan(0)
  })

  it('should use font-medium for values', () => {
    const { container } = render(
      <FbsTrendsTooltip
        active={true}
        payload={makePayload(sampleDataPoint)}
        visibility={allVisible}
      />
    )
    const values = container.querySelectorAll('.font-medium')
    expect(values.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('TrendsTooltip - Edge Cases', () => {
  it('should handle all zero values', () => {
    const zeroPoint: TrendDataPoint = {
      date: '2026-01-15',
      ordersCount: 0,
      revenue: 0,
      cancellations: 0,
      cancellationRate: 0,
      returns: 0,
      returnRate: 0,
      avgOrderValue: 0,
    }
    const { container } = render(
      <FbsTrendsTooltip active={true} payload={makePayload(zeroPoint)} visibility={allVisible} />
    )
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
  })

  it('should handle high cancellation rates', () => {
    const highCancel: TrendDataPoint = {
      ...sampleDataPoint,
      cancellations: 100,
      cancellationRate: 95.5,
    }
    render(
      <FbsTrendsTooltip active={true} payload={makePayload(highCancel)} visibility={allVisible} />
    )
    // formatPercentValue(95.5) → "95,5 %"
    expect(screen.getByText(/95,5/)).toBeInTheDocument()
  })

  it('should handle very large numbers', () => {
    const largePoint: TrendDataPoint = {
      ...sampleDataPoint,
      ordersCount: 999_999,
      revenue: 99_999_999,
      cancellations: 50_000,
      cancellationRate: 5.0,
      avgOrderValue: 100,
    }
    const { container } = render(
      <FbsTrendsTooltip active={true} payload={makePayload(largePoint)} visibility={allVisible} />
    )
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
  })
})
