/**
 * ReturnsPageContent tests — Story 169.11-FE
 *
 * Route-owned C4 locks: filtered-empty with a VISIBLE reset (the anomalyOnly
 * checkbox toggles the filtered-empty message and unchecking restores the
 * global-empty message), PageHeader adoption, and preserved aria-labelledby
 * linkage. Shared consumers (pickers, export) are stubbed — they are read-only
 * outside the owned surface.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock window.matchMedia for JSDOM (ReturnTrendChart prefers-reduced-motion guard).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('@/hooks/use-return-analytics', () => ({
  useReturnsBySku: vi.fn(),
  useReturnReasons: vi.fn(),
}))

vi.mock('@/hooks/use-returns-daily', () => ({
  useReturnsDailyTrends: vi.fn(),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: () => <div data-testid="returns-date-range" />,
}))

vi.mock('@/components/custom/ComparisonPeriodSelector', () => ({
  ComparisonPeriodSelector: () => <div data-testid="comparison-selector" />,
}))

vi.mock('@/components/custom/ai/ExportCsvButton', () => ({
  ExportCsvButton: () => <button type="button">Скачать CSV</button>,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

import { useReturnsBySku, useReturnReasons } from '@/hooks/use-return-analytics'
import { useReturnsDailyTrends } from '@/hooks/use-returns-daily'
import { useProducts } from '@/hooks/useProducts'
import { ReturnsPageContent } from '../ReturnsPageContent'

const mockBySku = vi.mocked(useReturnsBySku)
const mockReasons = vi.mocked(useReturnReasons)
const mockDaily = vi.mocked(useReturnsDailyTrends)
const mockProducts = vi.mocked(useProducts)

const emptyBySku = {
  data: { data: [], pagination: { count: 0 }, summary: { totalSkus: 0, anomalyCount: 0 } },
  isLoading: false,
  isError: false,
}

function setupPage() {
  mockBySku.mockReturnValue(emptyBySku as unknown as ReturnType<typeof useReturnsBySku>)
  mockReasons.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useReturnReasons>)
  mockDaily.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useReturnsDailyTrends>)
  // Bridge the partial mock through unknown (anti-pattern #4 subset-interface rule)
  mockProducts.mockReturnValue({
    data: { products: [], pagination: { count: 0 } },
    isLoading: false,
  } as unknown as ReturnType<typeof useProducts>)
}

describe('ReturnsPageContent (Story 169.11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupPage()
  })

  it('renders the PageHeader h1 «Аналитика возвратов» (level 1)', () => {
    render(<ReturnsPageContent />)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Аналитика возвратов' })
    expect(h1).toBeInTheDocument()
  })

  it('filtered-empty shows the anomaly-specific message and the checkbox is a visible reset', async () => {
    const user = userEvent.setup()
    render(<ReturnsPageContent />)
    // Global empty (no filter) first
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()

    // Enable the filter → filtered-empty message
    await user.click(screen.getByLabelText('Только проблемные'))
    expect(screen.getByText('Нет проблемных товаров за выбранный период')).toBeInTheDocument()

    // Visible reset: uncheck restores the global-empty message
    await user.click(screen.getByLabelText('Только проблемные'))
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('preserves the aria-labelledby linkage for the anomaly checkbox', () => {
    render(<ReturnsPageContent />)
    const checkbox = screen.getByLabelText('Только проблемные')
    expect(checkbox.getAttribute('aria-labelledby')).toBe('returns-anomaly-label')
    expect(document.getElementById('returns-anomaly-label')).not.toBeNull()
  })
})
