/**
 * Tests for ProductAnalyticsContent — Unified Product Analytics shell (Stories 120.5–120.7-FE).
 * Covers: header render, opaque-id handling (AP#10), all four tabs, data-driven
 * overview/advertising/organic tabs, and funnel placeholder.
 *
 * TanStack Query mock: all 3 hooks mocked at module level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { emptyUnifiedProduct, emptyUnifiedProductData } from '@/test/fixtures/unified-product-empty'
import { UNIFIED_PRODUCT_TABS, UNIFIED_PRODUCT_TAB_LABELS } from '@/types/unified-product'

// Mock all 3 data hooks
vi.mock('@/hooks/use-unified-product-analytics', () => ({
  useUnifiedProductAnalytics: vi.fn(),
  useOrganicShare: vi.fn(),
  useIncrementalRoas: vi.fn(),
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

function setAllLoaded() {
  mockUnified.mockReturnValue({
    data: emptyUnifiedProductData(),
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useUnifiedProductAnalytics>)
  mockOrganic.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useOrganicShare>)
  mockIroas.mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useIncrementalRoas>)
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

  it('renders all four tabs with their Russian labels', () => {
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
    } as ReturnType<typeof useUnifiedProductAnalytics>)
    render(<ProductAnalyticsContent nmId="1" />)
    expect(document.querySelectorAll('.animate-pulse').length).toBe(4)
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

  it('switches to funnel placeholder tab', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)
    await user.click(screen.getByRole('tab', { name: 'Воронка' }))
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText('Раздел «Воронка» в разработке')).toBeInTheDocument()
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
