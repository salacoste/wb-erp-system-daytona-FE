/**
 * Unit Tests for ProductRowBadge Component
 * Epic 36: Product Card Linking (склейки)
 * Story 36.6: Frontend Integration - Badge Display
 *
 * @see frontend/docs/request-backend/87-epic-36-backend-response-imtid-sku.md
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ProductRowBadge } from './ProductRowBadge'
import type { AdvertisingItem } from '@/types/advertising-analytics'

// Mock Radix UI Tooltip to avoid timing issues in tests
// Tooltips use portals and delayed states that are hard to test reliably
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-trigger">{children}</span>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

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
      const mockCallback = vi.fn()
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

    it('should show tooltip content with main product explanation', () => {
      // With mocked tooltip, content is always rendered
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} />)

      // Tooltip content should explain main product (look inside tooltip-content)
      const tooltipContent = screen.getByTestId('tooltip-content')
      expect(tooltipContent).toHaveTextContent(/Главный товар в склейке/)
      expect(tooltipContent).toHaveTextContent(/получает рекламный бюджет/)
    })

    it('should call onShowMergedGroup when button clicked', async () => {
      const user = userEvent.setup()
      const mockCallback = vi.fn()
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} onShowMergedGroup={mockCallback} />)

      // With mocked tooltip, button is always visible
      const button = screen.getByText(/Показать метрики склейки/)
      await user.click(button)

      // Callback should be called with imtId
      expect(mockCallback).toHaveBeenCalledWith(328632)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should NOT show button when callback not provided', () => {
      const item = createMockItem({ imtId: 328632, spend: 11337 })
      render(<ProductRowBadge item={item} />)

      // Button should not exist when no callback provided
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

      // Badge component applies variant styles - secondary variant has bg-secondary class
      const badge = container.querySelector('[class*="bg-secondary"]')
      expect(badge).toBeInTheDocument()
    })

    it('should show tooltip content with child product explanation', () => {
      // With mocked tooltip, content is always rendered
      const item = createMockItem({ imtId: 328632, spend: 0 })
      render(<ProductRowBadge item={item} />)

      // Tooltip content should explain child product (look inside tooltip-content)
      const tooltipContent = screen.getByTestId('tooltip-content')
      expect(tooltipContent).toHaveTextContent(/Дочерний товар склейки/)
      expect(tooltipContent).toHaveTextContent(/не получает прямой бюджет/)
    })

    it('should call onShowMergedGroup when button clicked from child product', async () => {
      const user = userEvent.setup()
      const mockCallback = vi.fn()
      const item = createMockItem({ imtId: 328632, spend: 0 })
      render(<ProductRowBadge item={item} onShowMergedGroup={mockCallback} />)

      // With mocked tooltip, button is always visible
      const button = screen.getByText(/Показать метрики склейки/)
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
      const mockCallback = vi.fn()
      const mockParentClick = vi.fn()
      const item = createMockItem({ imtId: 328632, spend: 100 })

      render(
        <div onClick={mockParentClick}>
          <ProductRowBadge item={item} onShowMergedGroup={mockCallback} />
        </div>
      )

      // With mocked tooltip, button is always visible
      const button = screen.getByText(/Показать метрики склейки/)
      await user.click(button)

      // Only callback should fire, not parent click
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })
})
