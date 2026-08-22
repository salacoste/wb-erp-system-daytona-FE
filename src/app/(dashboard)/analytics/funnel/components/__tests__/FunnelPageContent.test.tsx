import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/utils/test-utils'

import { FunnelPageContent } from '../FunnelPageContent'

const routerReplace = vi.fn()
let searchParamsValue = ''

vi.mock('next/navigation', () => ({
  usePathname: () => '/analytics/funnel',
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: () => <div data-testid="date-range-picker" />,
}))

interface ComparisonSelectorProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  preset: string
  onPresetChange: (preset: 'previous' | 'year_ago' | 'custom') => void
  compareStart: string
  compareEnd: string
  onCompareRangeChange: (start: string, end: string) => void
}

vi.mock('@/components/custom/ComparisonPeriodSelector', () => ({
  ComparisonPeriodSelector: (props: ComparisonSelectorProps) => (
    <div>
      <span data-testid="comparison-selector-state">
        {props.preset}|{props.compareStart}|{props.compareEnd}
      </span>
      <button type="button" onClick={() => props.onEnabledChange(true)}>
        Включить сравнение
      </button>
      <button
        type="button"
        onClick={() => {
          props.onPresetChange('custom')
          props.onCompareRangeChange('2025-01-01', '2025-01-15')
        }}
      >
        Задать пользовательский период
      </button>
    </div>
  ),
}))

vi.mock('@/components/custom/ai/ExportCsvButton', () => ({
  ExportCsvButton: () => <button type="button">Скачать CSV</button>,
}))

vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelSyncStatus: () => ({ data: undefined }),
  useFunnelTimeSeries: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/advertising/hooks', () => ({
  useAdvertisingAnalytics: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('../useFunnelExportData', () => ({
  useFunnelExportData: () => ({ exportItems: [], csvContent: '', csvFileName: 'funnel.csv' }),
}))

vi.mock('../funnel-page-helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('../funnel-page-helpers')>()
  return {
    ...actual,
    getDefaultRange: () => ({ from: new Date(2026, 2, 1), to: new Date(2026, 2, 7) }),
  }
})

vi.mock('../FunnelProductFilter', () => ({
  FunnelProductFilter: () => <div data-testid="product-filter" />,
}))

vi.mock('../FunnelSummaryCards', () => ({
  FunnelSummaryCards: (props: {
    compareEnabled?: boolean
    compareFrom?: string
    compareTo?: string
  }) => (
    <div
      data-testid="summary-cards"
      data-compare-enabled={String(props.compareEnabled)}
      data-compare-from={props.compareFrom}
      data-compare-to={props.compareTo}
    />
  ),
}))

vi.mock('../FunnelTable', () => ({
  FunnelTable: (props: { compareEnabled?: boolean; compareFrom?: string; compareTo?: string }) => (
    <div
      data-testid="funnel-table"
      data-compare-enabled={String(props.compareEnabled)}
      data-compare-from={props.compareFrom}
      data-compare-to={props.compareTo}
    />
  ),
}))

vi.mock('../FunnelOverlayChart', () => ({
  FunnelOverlayChart: (props: {
    periodFrom?: string
    periodTo?: string
    selectedProductCount?: number
  }) => (
    <div
      data-testid="overlay-chart"
      data-period-from={props.periodFrom}
      data-period-to={props.periodTo}
      data-selected-product-count={props.selectedProductCount}
    />
  ),
}))

vi.mock('../SyncStatusBanner', () => ({
  SyncStatusBanner: () => <div data-testid="sync-status" />,
}))

describe('FunnelPageContent — Story 169.8 contracts', () => {
  beforeEach(() => {
    routerReplace.mockReset()
    searchParamsValue = ''
  })

  it('renders the stable route identity through the shared PageHeader', async () => {
    renderWithProviders(<FunnelPageContent />)

    const heading = await screen.findByRole('heading', { level: 1, name: 'Воронка продаж' })
    expect(heading.closest('[data-slot="page-header"]')).not.toBeNull()
    expect(screen.getByText('Просмотры → корзина → заказы → выкупы → отмены')).toBeInTheDocument()
  })

  it('keeps comparison queries on the immediately preceding active period after custom selector changes', async () => {
    renderWithProviders(<FunnelPageContent />)

    await waitFor(() => {
      expect(screen.getByTestId('summary-cards')).toHaveAttribute('data-compare-from', '')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Включить сравнение' }))
    fireEvent.click(screen.getByRole('button', { name: 'Задать пользовательский период' }))

    expect(screen.getByTestId('comparison-selector-state')).toHaveTextContent(
      'custom|2025-01-01|2025-01-15'
    )
    for (const testId of ['summary-cards', 'funnel-table']) {
      const consumer = screen.getByTestId(testId)
      expect(consumer).toHaveAttribute('data-compare-enabled', 'true')
      expect(consumer).toHaveAttribute('data-compare-from', '2026-02-22')
      expect(consumer).toHaveAttribute('data-compare-to', '2026-02-28')
      expect(consumer).not.toHaveAttribute('data-compare-from', '2025-01-01')
      expect(consumer).not.toHaveAttribute('data-compare-to', '2025-01-15')
    }
  })

  it('passes no comparison query dates while comparison is disabled', async () => {
    renderWithProviders(<FunnelPageContent />)

    await waitFor(() => {
      for (const testId of ['summary-cards', 'funnel-table']) {
        const consumer = screen.getByTestId(testId)
        expect(consumer).toHaveAttribute('data-compare-enabled', 'false')
        expect(consumer).toHaveAttribute('data-compare-from', '')
        expect(consumer).toHaveAttribute('data-compare-to', '')
      }
    })
  })

  it('passes the active route period and selected-product scope to chart presentation', async () => {
    searchParamsValue = 'nmIds=123,456'
    renderWithProviders(<FunnelPageContent />)

    fireEvent.click(await screen.findByRole('button', { name: 'Показать график' }))

    await waitFor(() => {
      const chart = screen.getByTestId('overlay-chart')
      expect(chart).toHaveAttribute('data-period-from', '2026-03-01')
      expect(chart).toHaveAttribute('data-period-to', '2026-03-07')
      expect(chart).toHaveAttribute('data-selected-product-count', '2')
    })
  })
})
