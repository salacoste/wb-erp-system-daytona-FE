import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import { FbsEnhancedPageContent } from '../FbsEnhancedPageContent'

const mockUseFbsEnhanced = vi.fn()
const mockUseDelayedLoadingState = vi.fn()

vi.mock('@/hooks/use-fbs-enhanced', () => ({
  useFbsEnhanced: (...args: unknown[]) => mockUseFbsEnhanced(...args),
}))

vi.mock('@/hooks/useDelayedLoadingState', () => ({
  useDelayedLoadingState: (...args: unknown[]) => mockUseDelayedLoadingState(...args),
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: () => <div data-testid="date-range-picker" />,
}))

vi.mock('../FbsOrderStatsSection', () => ({
  FbsOrderStatsSection: () => <div data-testid="order-stats-section" />,
}))

vi.mock('../FbsStockAnalyticsSection', () => ({
  FbsStockAnalyticsSection: () => <div data-testid="stock-analytics-section" />,
}))

vi.mock('../FbsRegionalDataSection', () => ({
  FbsRegionalDataSection: () => <div data-testid="regional-data-section" />,
}))

vi.mock('../FbsCalculatedMetricsSection', () => ({
  FbsCalculatedMetricsSection: () => <div data-testid="calculated-metrics-section" />,
}))

vi.mock('../FbsFunnelSection', () => ({
  FbsFunnelSection: () => <div data-testid="funnel-section" />,
}))

describe('FbsEnhancedPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDelayedLoadingState.mockReturnValue(false)
  })

  it('shows retryable slow-loading state after the delayed-loading threshold', async () => {
    const refetch = vi.fn()
    mockUseFbsEnhanced.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch,
    })
    mockUseDelayedLoadingState.mockReturnValue(true)

    renderWithProviders(<FbsEnhancedPageContent />)

    expect(screen.getByText(/Данные FBS загружаются дольше обычного/)).toBeInTheDocument()
    await screen.getByRole('button', { name: /Повторить/ }).click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows a retryable error state when the enhanced FBS request times out', async () => {
    const refetch = vi.fn()
    mockUseFbsEnhanced.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<FbsEnhancedPageContent />)

    expect(
      screen.getByText(/Не удалось загрузить данные расширенной аналитики FBS/)
    ).toBeInTheDocument()
    await screen.getByRole('button', { name: /Повторить/ }).click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the stale-data banner with warning status tokens when cached data exists (Epic 169.6)', () => {
    // isError + non-null data → stale-data banner (fetch error with cached data).
    // Exact class pins (169.5 matched-pair /15+30 warning idiom) — no [class*=].
    mockUseFbsEnhanced.mockReturnValue({
      data: { orderStats: null },
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<FbsEnhancedPageContent />)

    const banner = screen.getByText(/Не удалось обновить/).parentElement
    expect(banner).not.toBeNull()
    expect(banner?.classList.contains('border-status-warning/30')).toBe(true)
    expect(banner?.classList.contains('bg-status-warning/15')).toBe(true)
    expect(banner?.classList.contains('text-status-warning')).toBe(true)
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })
})
