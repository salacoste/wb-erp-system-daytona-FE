/**
 * Story 170.6-FE (AC-2) — one-source-partial coexistence (169.12 pattern).
 * Exactly one product-level source fails → destructive SourceErrorBanner names the
 * failed source, the loaded source's rows STILL render (partial merge), and the
 * full ErrorState is NOT shown (that path stays for both-failed, e2e-pinned texts).
 * The third query (groupBy=query) failure → SectionWarningBanner while the rest
 * of the page keeps rendering.
 *
 * Hooks/modules mocked at the boundary; merge/summary/table logic runs for real.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { CrossReferencePageContent } from '../CrossReferencePageContent'

// Passthrough gate — Jam subscription is out of scope here.
vi.mock('@/components/custom/jam/RequireJam', () => ({
  RequireJam: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({ id }: { id?: string }) => <div data-testid={id} />,
}))
vi.mock('@/components/custom/ai/ExportCsvButton', () => ({
  ExportCsvButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}))

let productQuery: Record<string, unknown>
let queryQuery: Record<string, unknown>
let adQuery: Record<string, unknown>

vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: (
    _from: string,
    _to: string,
    opts: { groupBy?: string }
  ): Record<string, unknown> => (opts?.groupBy === 'query' ? queryQuery : productQuery),
}))
vi.mock('@/hooks/advertising/hooks', () => ({
  useAdvertisingAnalytics: (): Record<string, unknown> => adQuery,
}))

const okSearchProduct = {
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  data: {
    items: [
      { key: '101', totalOrders: 7, vendorCode: 'VC-101', uniqueQueries: 2 },
      { key: '102', totalOrders: 3, vendorCode: 'VC-102', uniqueQueries: 1 },
    ],
  },
}
const emptySearchProduct = { ...okSearchProduct, data: { items: [] } }

const okQuery = {
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  data: { items: [] },
}
const okAd = {
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  data: {
    data: [
      {
        key: 'sku:201',
        spend: 500,
        clicks: 5,
        revenue: null,
        organic_contribution: 10,
        sku_id: 'SKU-201',
      },
    ],
  },
}
const failedSearch = {
  isLoading: false,
  isError: true,
  error: new Error('search 500'),
  refetch: vi.fn(),
  data: undefined,
}
const failedAd = {
  isLoading: false,
  isError: true,
  error: new Error('ad 500'),
  refetch: vi.fn(),
  data: undefined,
}
const failedQuery = {
  isLoading: false,
  isError: true,
  error: new Error('query 500'),
  refetch: vi.fn(),
  data: undefined,
}

describe('CrossReferencePageContent — one-source partial (AC-2)', () => {
  it('ad fails + search ok → destructive banner names реклама, search rows REMAIN, no full ErrorState', () => {
    productQuery = okSearchProduct
    queryQuery = okQuery
    adQuery = failedAd
    render(<CrossReferencePageContent />)
    const banner = screen.getByTestId('source-error-banner')
    expect(banner.textContent).toContain('Не удалось загрузить данные: реклама')
    expect(banner.textContent).toContain('органический поиск')
    // Working source's data remains rendered
    const table = screen.getByRole('table', { name: 'Таблица кросс-анализа' })
    expect(within(table).getByText('VC-101')).toBeInTheDocument()
    expect(within(table).getByText('VC-102')).toBeInTheDocument()
    // NOT the both-failed full ErrorState (e2e-pinned text must not appear here)
    expect(
      screen.queryByText('Не удалось загрузить данные. Попробуйте снова.')
    ).not.toBeInTheDocument()
  })

  it('search fails + ad ok → banner names органический поиск, ad rows REMAIN', () => {
    productQuery = failedSearch
    queryQuery = okQuery
    adQuery = okAd
    render(<CrossReferencePageContent />)
    const banner = screen.getByTestId('source-error-banner')
    expect(banner.textContent).toContain('Не удалось загрузить данные: органический поиск')
    const table = screen.getByRole('table', { name: 'Таблица кросс-анализа' })
    expect(within(table).getByText('SKU-201')).toBeInTheDocument()
  })

  it('third query (groupBy=query) fails while product-level ok → section banner, page data intact', () => {
    productQuery = okSearchProduct
    queryQuery = failedQuery
    adQuery = okAd
    render(<CrossReferencePageContent />)
    const section = screen.getByTestId('section-warning-banner')
    expect(section.textContent).toContain('Не удалось загрузить данные по поисковым запросам')
    // Rest of the page still renders
    expect(screen.getByText('Только органика')).toBeInTheDocument()
    expect(screen.queryByTestId('source-error-banner')).not.toBeInTheDocument()
  })

  it('both product-level sources fail → FULL ErrorState with the exact e2e-pinned texts', () => {
    productQuery = failedSearch
    queryQuery = okQuery
    adQuery = failedAd
    render(<CrossReferencePageContent />)
    expect(screen.getByText('Не удалось загрузить данные. Попробуйте снова.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
    expect(screen.queryByTestId('source-error-banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('round-2 F1 composite: ad fails + search ok-but-EMPTY → honest banner wording AND EmptyState (no false «отображены ниже»)', () => {
    productQuery = emptySearchProduct
    queryQuery = okQuery
    adQuery = failedAd
    render(<CrossReferencePageContent />)
    const banner = screen.getByTestId('source-error-banner')
    // Honest wording: loaded but no data — NOT «отображены ниже»
    expect(banner.textContent).toContain('но данных за выбранный период нет')
    expect(banner.textContent).not.toContain('отображены ниже')
    // EmptyState composite renders beneath the banner
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    // Still NOT the both-failed full ErrorState
    expect(
      screen.queryByText('Не удалось загрузить данные. Попробуйте снова.')
    ).not.toBeInTheDocument()
  })
})