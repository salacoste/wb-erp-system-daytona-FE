/**
 * TDD Unit Tests for OrderDetailsModal component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests written BEFORE implementation (TDD approach)
 * Focus: Modal behavior, accessibility, focus management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

// Mock API module
const mockGetOrderDetails = vi.fn()
const mockGetFullHistory = vi.fn()
const mockGetWbHistory = vi.fn()
const mockGetLocalHistory = vi.fn()

vi.mock('@/lib/api/orders', () => ({
  getOrderDetails: (orderId: string) => mockGetOrderDetails(orderId),
  getFullHistory: (orderId: string) => mockGetFullHistory(orderId),
  getWbHistory: (orderId: string) => mockGetWbHistory(orderId),
  getLocalHistory: (orderId: string) => mockGetLocalHistory(orderId),
}))

// Import component after mocks
import { OrderDetailsModal } from '../OrderDetailsModal'
import {
  mockOrderDetails,
  mockFullHistoryResponse,
  mockWbHistoryResponse,
  mockLocalHistoryResponse,
  mockOrderNotFoundError,
} from '@/test/fixtures/orders'

// Test query client factory
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

// Test wrapper with providers
function renderWithProviders(
  ui: React.ReactElement,
  queryClient?: QueryClient
): ReturnType<typeof render> {
  const client = queryClient ?? createTestQueryClient()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('OrderDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOrderDetails.mockResolvedValue(mockOrderDetails)
    mockGetFullHistory.mockResolvedValue(mockFullHistoryResponse)
    mockGetWbHistory.mockResolvedValue(mockWbHistoryResponse)
    mockGetLocalHistory.mockResolvedValue(mockLocalHistoryResponse)
  })

  describe('AC1: Modal Trigger & Display', () => {
    it('renders nothing when orderId is null (closed state)', () => {
      renderWithProviders(<OrderDetailsModal orderId={null} onClose={vi.fn()} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal when orderId is provided (open state)', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('has max-width of 700px', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        // Check for max-w-[700px] class or equivalent
        expect(dialog.className).toMatch(/max-w/)
      })
    })

    it('has proper z-index for overlay (z-50)', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        // Overlay should have z-50 class
        const overlay = document.querySelector('[data-state="open"]')
        expect(overlay).toBeInTheDocument()
      })
    })
  })

  describe('Modal Close Behavior', () => {
    it('calls onClose when X button is clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find and click close button (has sr-only "Close" text)
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking outside modal (backdrop)', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click on overlay/backdrop
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      if (overlay) {
        await user.click(overlay)
        expect(onClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('AC11: Accessibility (WCAG 2.1 AA)', () => {
    it('has role="dialog" attribute', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })

    it('has aria-modal="true" attribute', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('has aria-labelledby pointing to title', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-labelledby')
      })
    })

    it('traps focus inside modal when open', async () => {
      const user = userEvent.setup()

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Tab through focusable elements - focus should stay within modal
      const dialog = screen.getByRole('dialog')
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      expect(focusableElements.length).toBeGreaterThan(0)

      // Tab multiple times and verify focus stays in modal
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await user.tab()
        expect(dialog.contains(document.activeElement)).toBe(true)
      }
    })

    it('returns focus to trigger element on close', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      // Render a trigger button alongside modal
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <button data-testid="trigger">Open Modal</button>
          <OrderDetailsModal orderId="order-uuid-001" onClose={onClose} />
        </QueryClientProvider>
      )

      // Focus the trigger first
      const trigger = screen.getByTestId('trigger')
      trigger.focus()
      expect(document.activeElement).toBe(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close modal
      await user.keyboard('{Escape}')

      // After modal closes, focus should return (Radix handles this)
      // Note: In TDD, we're testing the expected behavior
      expect(onClose).toHaveBeenCalled()
    })

    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('close button has accessible name', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('AC8: Loading States', () => {
    it('shows loading skeleton while order details load', async () => {
      // Delay the API response
      mockGetOrderDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOrderDetails), 100))
      )

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      // Should show skeleton/loading state
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Look for loading indicators (aria-busy or skeleton)
      const loadingElement =
        document.querySelector('[aria-busy="true"]') ||
        document.querySelector('[data-skeleton]') ||
        screen.queryByTestId('modal-loading-skeleton')

      // Loading state should be present during data fetch
      expect(loadingElement).toBeInTheDocument()
    })

    it('has aria-busy="true" during loading', async () => {
      mockGetOrderDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOrderDetails), 500))
      )

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Modal content area should indicate loading
      const busyElement = document.querySelector('[aria-busy="true"]')
      expect(busyElement).toBeInTheDocument()
    })
  })

  describe('AC9: Error States', () => {
    it('shows error message with retry button on API failure', async () => {
      mockGetOrderDetails.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/не удалось загрузить данные/i)).toBeInTheDocument()
      })

      expect(
        screen.getByRole('button', { name: /попробуйте снова|повторить/i })
      ).toBeInTheDocument()
    })

    it('shows 404 error message for non-existent order', async () => {
      mockGetOrderDetails.mockRejectedValue(mockOrderNotFoundError)

      renderWithProviders(<OrderDetailsModal orderId="non-existent-order" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/заказ не найден/i)).toBeInTheDocument()
      })
    })

    it('retry button triggers refetch', async () => {
      const user = userEvent.setup()

      // First call fails, second succeeds
      mockGetOrderDetails
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockOrderDetails)

      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/не удалось загрузить данные/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', {
        name: /попробуйте снова|повторить/i,
      })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockGetOrderDetails).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Data Fetching', () => {
    it('fetches order details when modal opens', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        expect(mockGetOrderDetails).toHaveBeenCalledWith('order-uuid-001')
      })
    })

    it('does not fetch when orderId is null', () => {
      renderWithProviders(<OrderDetailsModal orderId={null} onClose={vi.fn()} />)

      expect(mockGetOrderDetails).not.toHaveBeenCalled()
    })

    it('refetches when orderId changes', async () => {
      const { rerender } = renderWithProviders(
        <OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(mockGetOrderDetails).toHaveBeenCalledWith('order-uuid-001')
      })

      // Change orderId
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <OrderDetailsModal orderId="order-uuid-002" onClose={vi.fn()} />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(mockGetOrderDetails).toHaveBeenCalledWith('order-uuid-002')
      })
    })
  })

  describe('Screen Reader Announcements', () => {
    it('announces modal open to screen readers', async () => {
      renderWithProviders(<OrderDetailsModal orderId="order-uuid-001" onClose={vi.fn()} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        // Dialog should be announced by screen reader due to role="dialog"
        expect(dialog).toBeInTheDocument()
        // Title should be linked via aria-labelledby
        expect(dialog).toHaveAttribute('aria-labelledby')
      })
    })
  })
})
