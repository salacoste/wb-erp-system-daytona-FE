/**
 * Tests for ProductAnalyticsContent — Unified Product Analytics shell (Stories 120.5 + 120.6-FE).
 * Covers: header render, opaque-id handling (AP#10), all four tabs, data-driven
 * overview tab, and tab switching to placeholder tabs.
 *
 * TanStack Query mock: the useUnifiedProductAnalytics hook is mocked to return
 * loading → data flow, so tests don't need QueryClient wrapping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { emptyUnifiedProduct, emptyUnifiedProductData } from '@/test/fixtures/unified-product-empty'
import { UNIFIED_PRODUCT_TABS, UNIFIED_PRODUCT_TAB_LABELS } from '@/types/unified-product'

// Mock the data hook — controls loading/data/error states per test
vi.mock('@/hooks/use-unified-product-analytics', () => ({
  useUnifiedProductAnalytics: vi.fn(),
}))

import { useUnifiedProductAnalytics } from '@/hooks/use-unified-product-analytics'
import { ProductAnalyticsContent } from '../ProductAnalyticsContent'

const mockHook = vi.mocked(useUnifiedProductAnalytics)

describe('ProductAnalyticsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: return loaded empty data
    mockHook.mockReturnValue({
      data: emptyUnifiedProductData(),
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useUnifiedProductAnalytics>)
  })

  it('renders the product header with the nmId', () => {
    const { nmId } = emptyUnifiedProduct()
    render(<ProductAnalyticsContent nmId={nmId} />)
    expect(screen.getByRole('heading', { name: `Аналитика товара #${nmId}` })).toBeInTheDocument()
  })

  it('renders an opaque nmId via String() without mangling leading zeros (AP#10)', () => {
    render(<ProductAnalyticsContent nmId="00123" />)
    expect(screen.getByRole('heading', { name: 'Аналитика товара #00123' })).toBeInTheDocument()
    expect(screen.queryByText(/#123\b/)).toBeNull()
  })

  it('renders all four tabs with their Russian labels', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    for (const tab of UNIFIED_PRODUCT_TABS) {
      expect(screen.getByRole('tab', { name: UNIFIED_PRODUCT_TAB_LABELS[tab] })).toBeInTheDocument()
    }
    expect(screen.getByRole('tablist', { name: 'Разделы аналитики товара' })).toBeInTheDocument()
  })

  it('shows the overview tab with KPI cards when data is loaded', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    // Overview tab is active by default — should show KPI titles from ProductOverviewTab
    expect(screen.getByText('Органический трафик')).toBeInTheDocument()
    expect(screen.getByText('Открытия карт')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useUnifiedProductAnalytics>)

    render(<ProductAnalyticsContent nmId="1" />)
    // Skeleton renders 4 animated divs
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(4)
  })

  it('switches to placeholder tabs on click', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)

    // Click non-overview tabs — should show placeholder
    for (const tab of UNIFIED_PRODUCT_TABS) {
      if (tab === 'overview') continue
      const label = UNIFIED_PRODUCT_TAB_LABELS[tab]
      await user.click(screen.getByRole('tab', { name: label }))
      const panel = screen.getByRole('tabpanel')
      expect(within(panel).getByText(`Раздел «${label}» в разработке`)).toBeInTheDocument()
    }
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
