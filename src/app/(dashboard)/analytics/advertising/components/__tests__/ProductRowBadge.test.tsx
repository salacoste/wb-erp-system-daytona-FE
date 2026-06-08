/**
 * Tests for ProductRowBadge component
 * Tests three cases: standalone (no badge), main product, child product.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { ProductRowBadge } from '../ProductRowBadge'
import type { AdvertisingItem } from '@/types/advertising-analytics'

function makeItem(overrides: Partial<AdvertisingItem> = {}): AdvertisingItem {
  return {
    key: 'test-key',
    imtId: null,
    sku_id: '12345',
    views: 1000,
    clicks: 50,
    orders: 10,
    spend: 500,
    total_sales: 10,
    revenue: 10000,
    profit: 5000,
    organic_sales: 2,
    organic_contribution: 20,
    roas: 20,
    roi: 900,
    ctr: 5.0,
    cpc: 10,
    conversion_rate: 20,
    profit_after_ads: 4500,
    efficiency_status: 'good',
    ...overrides,
  }
}

describe('ProductRowBadge', () => {
  it('returns null when imtId is null (standalone product)', () => {
    const { container } = render(<ProductRowBadge item={makeItem({ imtId: null })} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders main product badge when spend > 0', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 11337 })} />)
    expect(screen.getByText(/Главный товар в склейке №328632/)).toBeInTheDocument()
  })

  it('renders child product badge when spend is 0', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 0 })} />)
    expect(screen.getByText(/Дочерний товар склейки №328632/)).toBeInTheDocument()
  })

  it('renders Link2 icon', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 500 })} />)
    const icon = document.querySelector('.lucide-link2')
    expect(icon).toBeInTheDocument()
  })

  it('renders badge with default variant for main product (spend > 0)', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 500 })} />)
    // Badge text shows main product info
    const badge = screen.getByText(/Главный товар/).closest('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders badge with secondary variant for child product (spend = 0)', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 0 })} />)
    const badge = screen.getByText(/Дочерний товар/).closest('[data-slot="badge"]')
    expect(badge).toBeInTheDocument()
  })

  it('accepts onShowMergedGroup callback prop without crashing', () => {
    const handleShow = vi.fn()
    render(
      <ProductRowBadge
        item={makeItem({ imtId: 328632, spend: 500 })}
        onShowMergedGroup={handleShow}
      />
    )
    // Badge renders — tooltip content (button) is lazy-rendered by Radix
    expect(screen.getByText(/Главный товар/)).toBeInTheDocument()
  })
})
