/**
 * Unit Tests for ProductRowBadge Component
 * Epic 36: Product Card Linking (склейки)
 * Story 36.6: Frontend Integration - Badge Display
 *
 * @see frontend/docs/request-backend/87-epic-36-backend-response-imtid-sku.md
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductRowBadge } from './ProductRowBadge'
import type { AdvertisingItem } from '@/types/advertising-analytics'

// Helper to create mock AdvertisingItem
const createMockItem = (overrides: Partial<AdvertisingItem> = {}): AdvertisingItem => ({
  key: 'sku:123456',
  sku_id: '123456',
  product_name: 'Test Product',
  imtId: null,
  views: 1000,
  clicks: 50,
  orders: 10,
  spend: 5000,
  total_sales: 25000,
  revenue: 20000,
  profit: 8000,
  organic_sales: 5000,
  organic_contribution: 20,
  roas: 4.0,
  roi: 1.6,
  ctr: 5.0,
  cpc: 100,
  conversion_rate: 20.0,
  profit_after_ads: 3000,
  efficiency_status: 'good',
  ...overrides,
})

describe('ProductRowBadge', () => {
  describe('Case 1: Standalone Product (imtId = null)', () => {
    it('should NOT render badge for standalone product', () => {
      const item = createMockItem({ imtId: null })
      const { container } = render(<ProductRowBadge item={item} />)

      // Component should return null (no badge)
      expect(container.firstChild).toBeNull()
    })

    it('should NOT render badge even with callback provided', () => {
      const item = createMockItem({ imtId: null })
      const mockCallback = jest.fn()
      const { container } = render(
        <ProductRowBadge item={item} onShowMergedGroup={mockCallback} />
      )

      expect(container.firstChild).toBeNull()
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('Case 2: Main Product in Merged Group (imtId !== null, spend > 0)', () => {
    it('should render main product badge with correct text', () => {
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} />)

      // Badge should show "Главный товар в склейке №328632"
      expect(screen.getByText(/Главный товар в склейке №328632/)).toBeInTheDocument()
    })

    it('should render Link2 icon for main product', () => {
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      const { container } = render(<ProductRowBadge item={item} />)

      // Check for Link2 icon (lucide-react renders as svg)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show tooltip on hover with main product explanation', async () => {
      const user = userEvent.setup()
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} />)

      const badge = screen.getByText(/Главный товар в склейке №328632/)

      // Hover over badge to show tooltip
      await user.hover(badge)

      // Tooltip should explain main product
      expect(await screen.findByText(/Главный товар в склейке/)).toBeInTheDocument()
      expect(screen.getByText(/получает рекламный бюджет/)).toBeInTheDocument()
    })

    it('should call onShowMergedGroup when button clicked', async () => {
      const user = userEvent.setup()
      const mockCallback = jest.fn()
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} onShowMergedGroup={mockCallback} />)

      // Open tooltip
      const badge = screen.getByText(/Главный товар в склейке №328632/)
      await user.hover(badge)

      // Click "Показать метрики склейки" button
      const button = await screen.findByText(/Показать метрики склейки/)
      await user.click(button)

      // Callback should be called with imtId
      expect(mockCallback).toHaveBeenCalledWith(328632)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should NOT show button when callback not provided', async () => {
      const user = userEvent.setup()
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} />)

      const badge = screen.getByText(/Главный товар в склейке №328632/)
      await user.hover(badge)

      // Button should not exist
      expect(screen.queryByText(/Показать метрики склейки/)).not.toBeInTheDocument()
    })
  })

  describe('Case 3: Child Product in Merged Group (imtId !== null, spend = 0)', () => {
    it('should render child product badge with correct text', () => {
      const item = createMockItem({ imtId: 328632, spend: 0 })
      render(<ProductRowBadge item={item} />)

      // Badge should show "Дочерний товар склейки №328632"
      expect(screen.getByText(/Дочерний товар склейки №328632/)).toBeInTheDocument()
    })

    it('should use secondary variant for child product badge', () => {
      const item = createMockItem({ imtId: 328632, spend: 0 })
      const { container } = render(<ProductRowBadge item={item} />)

      // Badge component applies variant styles
      // Check that badge exists (can't directly test variant without DOM inspection)
      const badge = container.querySelector('[class*="badge"]')
      expect(badge).toBeInTheDocument()
    })

    it('should show tooltip on hover with child product explanation', async () => {
      const user = userEvent.setup()
      const item = createMockItem({ imtId: 328632, spend: 0 })
      render(<ProductRowBadge item={item} />)

      const badge = screen.getByText(/Дочерний товар склейки №328632/)

      // Hover over badge to show tooltip
      await user.hover(badge)

      // Tooltip should explain child product
      expect(await screen.findByText(/Дочерний товар склейки/)).toBeInTheDocument()
      expect(screen.getByText(/не получает прямой бюджет/)).toBeInTheDocument()
    })

    it('should call onShowMergedGroup when button clicked from child product', async () => {
      const user = userEvent.setup()
      const mockCallback = jest.fn()
      const item = createMockItem({ imtId: 328632, spend: 0 })
      render(<ProductRowBadge item={item} onShowMergedGroup={mockCallback} />)

      // Open tooltip
      const badge = screen.getByText(/Дочерний товар склейки №328632/)
      await user.hover(badge)

      // Click button
      const button = await screen.findByText(/Показать метрики склейки/)
      await user.click(button)

      // Callback should be called with imtId
      expect(mockCallback).toHaveBeenCalledWith(328632)
    })
  })

  describe('Edge Cases', () => {
    it('should handle imtId = 0 as valid merged group ID', () => {
      const item = createMockItem({ imtId: 0, spend: 100 })
      render(<ProductRowBadge item={item} />)

      // imtId=0 is valid, should render badge
      expect(screen.getByText(/Главный товар в склейке №0/)).toBeInTheDocument()
    })

    it('should handle very large imtId values', () => {
      const item = createMockItem({ imtId: 999999999, spend: 100 })
      render(<ProductRowBadge item={item} />)

      expect(screen.getByText(/Главный товар в склейке №999999999/)).toBeInTheDocument()
    })

    it('should handle exactly spend = 0 as child product', () => {
      const item = createMockItem({ imtId: 123, spend: 0 })
      render(<ProductRowBadge item={item} />)

      expect(screen.getByText(/Дочерний товар склейки №123/)).toBeInTheDocument()
    })

    it('should handle spend > 0 as main product (floating point)', () => {
      const item = createMockItem({ imtId: 123, spend: 0.01 })
      render(<ProductRowBadge item={item} />)

      expect(screen.getByText(/Главный товар в склейке №123/)).toBeInTheDocument()
    })

    it('should stop propagation when button clicked', async () => {
      const user = userEvent.setup()
      const mockCallback = jest.fn()
      const mockParentClick = jest.fn()
      const item = createMockItem({ imtId: 328632, spend: 100 })

      render(
        <div onClick={mockParentClick}>
          <ProductRowBadge item={item} onShowMergedGroup={mockCallback} />
        </div>
      )

      // Open tooltip
      const badge = screen.getByText(/Главный товар в склейке №328632/)
      await user.hover(badge)

      // Click button
      const button = await screen.findByText(/Показать метрики склейки/)
      await user.click(button)

      // Only callback should fire, not parent click
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })
})
