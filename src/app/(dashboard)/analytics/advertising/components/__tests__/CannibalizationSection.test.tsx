import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CannibalizationSection } from '../CannibalizationSection'
import type { AdvertisingItem } from '@/types/advertising-analytics'

/** Minimal factory — only sets fields the component reads. */
function makeItem(overrides: Partial<AdvertisingItem> = {}): AdvertisingItem {
  return {
    key: 'sku:12345',
    imtId: 12345,
    views: 100,
    clicks: 10,
    orders: 5,
    spend: 500,
    total_sales: 2000,
    revenue: 1800,
    profit: 600,
    organic_sales: 800,
    organic_contribution: 50,
    roas: 3.6,
    roi: 1.2,
    ctr: 0.1,
    cpc: 50,
    conversion_rate: 0.05,
    profit_after_ads: 100,
    efficiency_status: 'good',
    ...overrides,
  }
}

describe('CannibalizationSection', () => {
  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  it('shows skeleton when isLoading is true', () => {
    const { container } = render(<CannibalizationSection items={[]} isLoading={true} />)
    expect(screen.getByText('Каннибализация рекламы')).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  // --------------------------------------------------------------------------
  // Empty / null state
  // --------------------------------------------------------------------------
  it('returns null when no items have organicContribution > 40', () => {
    const { container } = render(
      <CannibalizationSection
        items={[makeItem({ organic_contribution: 30, spend: 1000 })]}
        isLoading={false}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when organicContribution > 40 but spend is 0', () => {
    const { container } = render(
      <CannibalizationSection
        items={[makeItem({ organic_contribution: 60, spend: 0 })]}
        isLoading={false}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null for empty items array', () => {
    const { container } = render(<CannibalizationSection items={[]} isLoading={false} />)
    expect(container.innerHTML).toBe('')
  })

  // --------------------------------------------------------------------------
  // Data rendering
  // --------------------------------------------------------------------------
  it('renders table with cannibalized products sorted by spend DESC', () => {
    const items = [
      makeItem({
        key: 'sku:111',
        spend: 300,
        organic_contribution: 55,
        organic_sales: 1000,
      }),
      makeItem({
        key: 'sku:222',
        spend: 900,
        organic_contribution: 50,
        organic_sales: 2000,
      }),
    ]

    render(<CannibalizationSection items={items} isLoading={false} />)

    // Title present
    expect(screen.getByText('Каннибализация рекламы')).toBeInTheDocument()

    // Badge shows count
    expect(screen.getByText('2 товар(ов)')).toBeInTheDocument()

    // Both nmIds extracted from keys
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('222')).toBeInTheDocument()

    // Sorted by spend DESC — 222 (900) comes before 111 (300)
    const rows = screen.getAllByRole('row')
    // row[0] = thead, row[1] = first data row (highest spend)
    expect(rows[1]).toHaveTextContent('222')
    expect(rows[2]).toHaveTextContent('111')
  })

  // --------------------------------------------------------------------------
  // Risk classification
  // --------------------------------------------------------------------------
  it('classifies high risk (>70%) and medium risk (40-70%)', () => {
    const items = [
      makeItem({
        key: 'sku:999',
        spend: 1000,
        organic_contribution: 85,
        organic_sales: 5000,
      }),
      makeItem({
        key: 'sku:888',
        spend: 500,
        organic_contribution: 55,
        organic_sales: 2000,
      }),
    ]

    render(<CannibalizationSection items={items} isLoading={false} />)

    const badges = screen.getAllByText(/Высокий|Средний/)
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveTextContent('Высокий')
    expect(badges[1]).toHaveTextContent('Средний')
  })

  // --------------------------------------------------------------------------
  // High-risk banner
  // --------------------------------------------------------------------------
  it('shows high-risk summary banner with count and wasted spend', () => {
    const items = [
      makeItem({
        key: 'sku:100',
        spend: 2000,
        organic_contribution: 80,
        organic_sales: 5000,
      }),
      makeItem({
        key: 'sku:200',
        spend: 1500,
        organic_contribution: 75,
        organic_sales: 3000,
      }),
    ]

    render(<CannibalizationSection items={items} isLoading={false} />)

    // Banner mentions high-risk count + wasted spend in a single <span>
    const banner = screen.getByText(/товаров с высоким риском каннибализации/)
    expect(banner).toBeInTheDocument()
    // The <strong>2</strong> sits inside the same span
    expect(banner.closest('[class*="bg-red-50"]')).toHaveTextContent('2')

    // Total wasted = 2000 + 1500 = 3500 — formatted as currency (Russian locale)
    expect(banner.closest('[class*="bg-red-50"]')).toHaveTextContent(/3\s?500/)
  })

  it('hides high-risk banner when only medium-risk products exist', () => {
    const items = [
      makeItem({
        key: 'sku:300',
        spend: 400,
        organic_contribution: 55,
        organic_sales: 1000,
      }),
    ]

    render(<CannibalizationSection items={items} isLoading={false} />)

    expect(screen.queryByText(/товаров с высоким риском каннибализации/)).not.toBeInTheDocument()
  })

  // --------------------------------------------------------------------------
  // Limit to 20 items
  // --------------------------------------------------------------------------
  it('limits table to 20 rows even with more items', () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      makeItem({
        key: `sku:${i + 1}`,
        spend: 1000 - i * 10,
        organic_contribution: 60 + (i % 20),
        organic_sales: 1000,
      })
    )

    render(<CannibalizationSection items={items} isLoading={false} />)

    const rows = screen.getAllByRole('row')
    // 1 thead row + 20 data rows = 21
    expect(rows).toHaveLength(21)
  })
})
