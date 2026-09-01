/**
 * Tests for ProductAnalyticsContent — Unified Product Analytics shell (Stories 120.5–120.7-FE).
 * Covers: header render, opaque-id handling (AP#10), all five tabs, data-driven
 * overview/advertising/organic tabs, and funnel tab with real data (Story 122.1-FE).
 *
 * TanStack Query mock: all 3 hooks mocked at module level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { emptyUnifiedProduct, emptyUnifiedProductData } from '@/test/fixtures/unified-product-empty'
import { UNIFIED_PRODUCT_TABS, UNIFIED_PRODUCT_TAB_LABELS } from '@/types/unified-product'
import { ApiError } from '@/types/api'

// Mock all 3 data hooks
vi.mock('@/hooks/use-unified-product-analytics', () => ({
  useUnifiedProductAnalytics: vi.fn(),
  useOrganicShare: vi.fn(),
  useIncrementalRoas: vi.fn(),
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({ onChange }: { onChange: (range: { from: Date; to: Date }) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ from: new Date('2026-07-01T00:00:00Z'), to: new Date('2026-07-07T00:00:00Z') })
      }
    >
      Изменить период
    </button>
  ),
}))

import {
  useUnifiedProductAnalytics,
  useOrganicShare,
  useIncrementalRoas,
} from '@/hooks/use-unified-product-analytics'
import { ProductAnalyticsContent } from '../ProductAnalyticsContent'

const mockUnified = vi.mocked(useUnifiedProductAnalytics)
const mockOrganic = vi.mocked(useOrganicShare)
const mockIroas = vi.mocked(useIncrementalRoas)

// Minimal mock shape — bridge via unknown to avoid missing TanStack Query observer fields (AP#4)
function setAllLoaded() {
  mockUnified.mockReturnValue({
    data: emptyUnifiedProductData(),
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useUnifiedProductAnalytics>)
  mockOrganic.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useOrganicShare>)
  mockIroas.mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useIncrementalRoas>)
}

describe('ProductAnalyticsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAllLoaded()
  })

  it('renders the product header with the nmId', () => {
    const { nmId } = emptyUnifiedProduct()
    render(<ProductAnalyticsContent nmId={nmId} />)
    expect(screen.getByRole('heading', { name: `Аналитика товара #${nmId}` })).toBeInTheDocument()
  })

  it('renders an opaque nmId via String() without mangling leading zeros (AP#10)', () => {
    render(<ProductAnalyticsContent nmId="00123" />)
    expect(screen.getByRole('heading', { name: 'Аналитика товара #00123' })).toBeInTheDocument()
  })

  it('renders a very long opaque product identifier without numeric coercion', () => {
    const longNmId = '999999999999999999999999999999'
    render(<ProductAnalyticsContent nmId={longNmId} />)
    expect(screen.getByRole('heading', { name: `Аналитика товара #${longNmId}` })).toBeInTheDocument()
  })

  it('renders all five tabs with their Russian labels', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    for (const tab of UNIFIED_PRODUCT_TABS) {
      expect(screen.getByRole('tab', { name: UNIFIED_PRODUCT_TAB_LABELS[tab] })).toBeInTheDocument()
    }
  })

  it('shows overview KPI cards when data is loaded', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    expect(screen.getByText('Органический трафик')).toBeInTheDocument()
    expect(screen.getByText('Открытия карт')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    mockUnified.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useUnifiedProductAnalytics>)
    render(<ProductAnalyticsContent nmId="1" />)
    expect(document.querySelectorAll('.animate-pulse').length).toBe(4)
  })

  it('renders an explicit not-found state for a missing product instead of a placeholder', () => {
    mockUnified.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError('missing', 404),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useUnifiedProductAnalytics>)

    render(<ProductAnalyticsContent nmId="404" />)

    expect(screen.getByText(/Товар не найден/)).toBeInTheDocument()
    expect(screen.queryByText(/раздел находится в разработке/i)).not.toBeInTheDocument()
  })

  it('updates every product query when the date range changes', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="123" />)

    await user.click(screen.getByRole('button', { name: 'Изменить период' }))

    expect(mockUnified).toHaveBeenLastCalledWith({
      nmId: '123',
      from: '2026-07-01',
      to: '2026-07-07',
    })
    expect(mockOrganic).toHaveBeenLastCalledWith({
      nmId: '123',
      from: '2026-07-01',
      to: '2026-07-07',
    })
    expect(mockIroas).toHaveBeenLastCalledWith({
      nmId: '123',
      from: '2026-07-01',
      to: '2026-07-07',
    })
  })

  it('switches to advertising tab with campaign data', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)
    await user.click(screen.getByRole('tab', { name: 'Реклама' }))
    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText('Затраты')).toBeInTheDocument()
  })

  it('switches to organic tab with iROAS insight', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)
    await user.click(screen.getByRole('tab', { name: 'Органика' }))
    expect(screen.getByText('Инкрементальный ROAS')).toBeInTheDocument()
  })

  it('switches to funnel tab with real KPI cards (Story 122.1-FE)', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)
    await user.click(screen.getByRole('tab', { name: 'Воронка' }))
    // Funnel tab now renders real KPI cards from FunnelTotals
    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText('Сквозная конверсия')).toBeInTheDocument()
  })

  it('renders a back link to the analytics hub', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    expect(screen.getByRole('link', { name: /Назад к аналитике/ })).toHaveAttribute(
      'href',
      '/analytics'
    )
  })
})

describe('emptyUnifiedProduct fixture (Pattern 3 seed)', () => {
  it('returns a default opaque nmId and merges overrides', () => {
    expect(emptyUnifiedProduct().nmId).toBe('887604577')
    expect(emptyUnifiedProduct({ nmId: '999' }).nmId).toBe('999')
  })
})
