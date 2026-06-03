/**
 * Integration tests for BuyoutSummaryWidget
 * Story 69.7: Buyout analytics component tests
 * Epic 69: Buyout Rate per-SKU analytics (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BuyoutSummaryWidget } from '../BuyoutSummaryWidget'
import { BUYOUT_SUMMARY_UNKNOWN_RESPONSE } from '@/test/fixtures/buyout-analytics'
import type { BuyoutSummaryResponse } from '@/types/analytics-buyout'
import type { ReturnBreakdown } from '@/types/fulfillment'

vi.mock('@/hooks/use-buyout-analytics', () => ({
  useBuyoutSummary: vi.fn(),
}))

import { useBuyoutSummary } from '@/hooks/use-buyout-analytics'
const mockUseBuyoutSummary = vi.mocked(useBuyoutSummary)

const defaultProps = { from: '2025-12-01', to: '2025-12-31', source: 'blended' as const }

const mockSummary: BuyoutSummaryResponse = {
  overallBuyoutRatePct: 78.5,
  overallReturnRatePct: 21.5,
  totalSalesCount: 1200,
  totalReturnsCount: 258,
  skuCount: 45,
  topDecliners: [
    { nmId: 111222, buyoutRatePct: 52, trendDelta: -8 },
    { nmId: 333444, buyoutRatePct: 61, trendDelta: -5 },
  ],
  period: { from: '2025-12-01', to: '2025-12-31' },
  source: 'blended',
  confidence: 'high',
}

const mockBreakdown: ReturnBreakdown = {
  cancelBeforeShipment: 40,
  refusalAtPvz: 30,
  returnAfterReceipt: 20,
  total: 90,
  classificationCoverage: 85,
}

function hookReturn(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isLoading: false, isError: false, ...overrides } as ReturnType<
    typeof useBuyoutSummary
  >
}

describe('BuyoutSummaryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton while fetching', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    // Skeleton has h-40 w-full classes
    const skeleton = container.querySelector('[class*="h-40"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ isError: true }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText('Не удалось загрузить сводку выкупов')).toBeInTheDocument()
  })

  it('returns null when data is undefined', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: undefined }))
    const { container } = renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders buyout percentage and return percentage', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText(/78,5\s+%\s+выкуп/)).toBeInTheDocument()
    expect(screen.getByText(/21,5\s+%\s+возвраты/)).toBeInTheDocument()
  })

  // AP#8 + Defensive Frontend: backend returns null rates for a no-sales period (undefined ratio).
  // `?? 0` previously rendered "0.0% выкуп" — a false catastrophic signal. Must show "no data".
  it('shows a "no data" state (not 0.0% выкуп) when rates are null', () => {
    const empty: BuyoutSummaryResponse = {
      ...mockSummary,
      overallBuyoutRatePct: null,
      overallReturnRatePct: null,
      totalSalesCount: 0,
      totalReturnsCount: 0,
      skuCount: 0,
      topDecliners: [],
    }
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: empty }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText('Нет данных о выкупах за выбранный период')).toBeInTheDocument()
    // The misleading "0.0% выкуп" / 0%-green bar must NOT appear
    expect(screen.queryByText(/0,0\s+%\s+выкуп/)).not.toBeInTheDocument()
  })

  it('renders "— возвраты" when only the return rate is null', () => {
    const partial: BuyoutSummaryResponse = {
      ...mockSummary,
      overallBuyoutRatePct: 95,
      overallReturnRatePct: null,
    }
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: partial }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText(/95,0\s+%\s+выкуп/)).toBeInTheDocument()
    expect(screen.getByText('— возвраты')).toBeInTheDocument()
  })

  // Defensive Frontend: the (contractually-impossible) buyout=null / return=non-null state must
  // INDICATE the orphan return rate, not silently drop it. Russian-locale via formatPercentage.
  it('surfaces an anomalous return rate when buyout is null but return is present', () => {
    const anomalous: BuyoutSummaryResponse = {
      ...mockSummary,
      overallBuyoutRatePct: null,
      overallReturnRatePct: 5.2,
    }
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: anomalous }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText('Нет данных о выкупах за выбранный период')).toBeInTheDocument()
    expect(screen.getByText(/процент выкупа недоступен/)).toBeInTheDocument()
    expect(screen.getByText(/5,2\s%/)).toBeInTheDocument()
  })

  it('renders progress bar with correct width', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    const { container } = renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    const bar = container.querySelector('.bg-green-500')
    expect(bar).toHaveStyle({ width: '78.5%' })
  })

  it('shows total returns count and sales count', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    // Russian locale uses non-breaking space: 1 200 / 258
    expect(screen.getByText(/258/)).toBeInTheDocument()
    expect(screen.getByText(/1[\s\u00a0]?200/)).toBeInTheDocument()
  })

  it('shows SKU count when available', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText(/45 SKU/)).toBeInTheDocument()
  })

  it('shows top decliners section', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.getByText('Снижение выкупа')).toBeInTheDocument()
    expect(screen.getByText('#111222')).toBeInTheDocument()
    expect(screen.getByText('#333444')).toBeInTheDocument()
    expect(screen.getByText(/52\s+%/)).toBeInTheDocument()
    // Regression: a decline (trendDelta=-8) must render WITH its minus sign.
    // Prior code used Math.abs() + an inverted prefix → "(8 п.п.)" (sign stripped).
    // Exact-match targets the inner red span ("(-8 п.п.)"); the parent's direct
    // text node is just "52%", so no multiple-element clash.
    expect(screen.getByText('(-8 п.п.)')).toBeInTheDocument()
    expect(screen.getByText('(-5 п.п.)')).toBeInTheDocument()
  })

  it('shows return breakdown bar when provided', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} returnBreakdown={mockBreakdown} />)
    expect(screen.getByText('Причины возвратов (FBS)')).toBeInTheDocument()
    expect(screen.getByText(/До отправки: 40/)).toBeInTheDocument()
    expect(screen.getByText(/Отказ на ПВЗ: 30/)).toBeInTheDocument()
    expect(screen.getByText(/После получения: 20/)).toBeInTheDocument()
    expect(screen.getByText(/Покрытие классификации: 85\s+%/)).toBeInTheDocument()
  })

  it('hides return breakdown when null', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} returnBreakdown={null} />)
    expect(screen.queryByText('Причины возвратов (FBS)')).not.toBeInTheDocument()
  })

  it('H2-1: shows footnote when source === "unknown" (Defensive Frontend Principle)', () => {
    // Uses BUYOUT_SUMMARY_UNKNOWN_RESPONSE fixture (L2-2 Pattern 3 factory)
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: BUYOUT_SUMMARY_UNKNOWN_RESPONSE }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    // SourceBadge renders the 'unknown' badge
    expect(screen.getByTestId('source-badge-unknown')).toBeInTheDocument()
    // H2-1 footnote: full "show an indicator" recipe — icon alone insufficient
    expect(screen.getByText(/Источник данных не распознан/)).toBeInTheDocument()
  })

  it('H2-1: does NOT show footnote for known sources', () => {
    mockUseBuyoutSummary.mockReturnValue(hookReturn({ data: mockSummary }))
    renderWithProviders(<BuyoutSummaryWidget {...defaultProps} />)
    expect(screen.queryByText(/Источник данных не распознан/)).not.toBeInTheDocument()
  })
})
