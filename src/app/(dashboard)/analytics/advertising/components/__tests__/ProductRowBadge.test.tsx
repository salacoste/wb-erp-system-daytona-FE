/**
 * Tests for ProductRowBadge component
 * Tests three cases: standalone (no badge), main product, child product.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
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

  it('calls onShowMergedGroup when button is clicked', async () => {
    const user = userEvent.setup()
    const handleShow = vi.fn()
    render(
      <ProductRowBadge
        item={makeItem({ imtId: 328632, spend: 500 })}
        onShowMergedGroup={handleShow}
      />
    )
    // Button rendered inside tooltip content
    const button = screen.getByText('Показать метрики склейки')
    expect(button).toBeInTheDocument()
    await user.click(button)
    expect(handleShow).toHaveBeenCalledWith(328632)
  })

  it('does not render action button when onShowMergedGroup is not provided', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 500 })} />)
    expect(screen.queryByText('Показать метрики склейки')).not.toBeInTheDocument()
  })

  it('renders "Главный товар" tooltip content for main product', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 500 })} />)
    expect(screen.getByText('Главный товар в склейке')).toBeInTheDocument()
    expect(screen.getByText(/получает рекламный бюджет/)).toBeInTheDocument()
  })

  it('renders "Дочерний товар" tooltip content for child product', () => {
    render(<ProductRowBadge item={makeItem({ imtId: 328632, spend: 0 })} />)
    expect(screen.getByText('Дочерний товар склейки')).toBeInTheDocument()
    expect(screen.getByText(/не получает прямой бюджет/)).toBeInTheDocument()
  })
})
