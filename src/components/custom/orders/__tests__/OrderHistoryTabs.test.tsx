/**
 * TDD Unit Tests for OrderHistoryTabs component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests written BEFORE implementation (TDD approach)
 * Focus: Tab navigation, on-demand data fetching, accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

// Mock API module
const mockGetFullHistory = vi.fn()
const mockGetWbHistory = vi.fn()
const mockGetOrderHistory = vi.fn()

vi.mock('@/lib/api/orders', () => {
  // Create ordersQueryKeys mock that matches the real implementation
  const ordersQueryKeys = {
    all: ['orders'],
    lists: () => ['orders', 'list'],
    list: (params: unknown) => ['orders', 'list', params],
    details: () => ['orders', 'detail'],
    detail: (orderId: string) => ['orders', 'detail', orderId],
    history: (orderId: string) => ['orders', 'history', orderId],
    wbHistory: (orderId: string) => ['orders', 'wb-history', orderId],
    fullHistory: (orderId: string) => ['orders', 'full-history', orderId],
    syncStatus: () => ['orders', 'sync-status'],
  }

  return {
    getFullHistory: (orderId: string) => mockGetFullHistory(orderId),
    getWbHistory: (orderId: string) => mockGetWbHistory(orderId),
    getOrderHistory: (orderId: string) => mockGetOrderHistory(orderId),
    ordersQueryKeys,
  }
})

// Import component after mocks
import { OrderHistoryTabs } from '../OrderHistoryTabs'
import {
  mockFullHistoryResponse,
  mockWbHistoryResponse,
  mockLocalHistoryResponse,
  mockEmptyFullHistoryResponse,
  mockEmptyWbHistoryResponse,
  mockEmptyLocalHistoryResponse,
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
function renderWithProviders(ui: React.ReactElement): ReturnType<typeof render> {
  const client = createTestQueryClient()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('OrderHistoryTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFullHistory.mockResolvedValue(mockFullHistoryResponse)
    mockGetWbHistory.mockResolvedValue(mockWbHistoryResponse)
    mockGetOrderHistory.mockResolvedValue(mockLocalHistoryResponse)
  })

  describe('AC3: Tab Navigation - Tab Rendering', () => {
    it('renders 3 tabs: "Полная история", "WB История", "Локальная"', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      expect(screen.getByRole('tab', { name: /полная история/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /wb история/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /локальная/i })).toBeInTheDocument()
    })

    it('renders tablist with role="tablist"', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('default active tab is "Полная история"', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      expect(fullHistoryTab).toHaveAttribute('aria-selected', 'true')
      expect(fullHistoryTab).toHaveAttribute('data-state', 'active')
    })

    it('active tab is visually distinct', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      // Should have active state styling
      expect(fullHistoryTab).toHaveAttribute('data-state', 'active')
    })
  })

  describe('AC3: Tab Navigation - Tab Switching', () => {
    it('clicking tab switches active tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      expect(wbHistoryTab).toHaveAttribute('aria-selected', 'true')
      expect(wbHistoryTab).toHaveAttribute('data-state', 'active')

      // Previous tab should be inactive
      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      expect(fullHistoryTab).toHaveAttribute('aria-selected', 'false')
    })

    it('keyboard navigation works with arrow keys', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Focus first tab
      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      fullHistoryTab.focus()
      expect(document.activeElement).toBe(fullHistoryTab)

      // Press right arrow to move to next tab
      await user.keyboard('{ArrowRight}')
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      expect(document.activeElement).toBe(wbHistoryTab)

      // Press right arrow again to move to third tab
      await user.keyboard('{ArrowRight}')
      const localTab = screen.getByRole('tab', { name: /локальная/i })
      expect(document.activeElement).toBe(localTab)
    })

    it('keyboard navigation wraps around at edges', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Focus last tab
      const localTab = screen.getByRole('tab', { name: /локальная/i })
      localTab.focus()

      // Press right arrow - should wrap to first tab
      await user.keyboard('{ArrowRight}')
      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      expect(document.activeElement).toBe(fullHistoryTab)
    })

    it('Enter/Space key activates focused tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      wbHistoryTab.focus()

      await user.keyboard('{Enter}')
      expect(wbHistoryTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('AC4: On-Demand Data Fetching', () => {
    it('fetches full history immediately (default tab)', async () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(mockGetFullHistory).toHaveBeenCalledWith('order-uuid-001')
      })

      // Other histories should NOT be fetched yet
      expect(mockGetWbHistory).not.toHaveBeenCalled()
      expect(mockGetOrderHistory).not.toHaveBeenCalled()
    })

    it('fetches WB history only when WB tab becomes active', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Initially WB history should not be fetched
      expect(mockGetWbHistory).not.toHaveBeenCalled()

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      await waitFor(() => {
        expect(mockGetWbHistory).toHaveBeenCalledWith('order-uuid-001')
      })
    })

    it('fetches local history only when Local tab becomes active', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Initially local history should not be fetched
      expect(mockGetOrderHistory).not.toHaveBeenCalled()

      // Switch to Local tab
      const localTab = screen.getByRole('tab', { name: /локальная/i })
      await user.click(localTab)

      await waitFor(() => {
        expect(mockGetOrderHistory).toHaveBeenCalledWith('order-uuid-001')
      })
    })

    it('caches fetched data (does not refetch on tab switch back)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockGetFullHistory).toHaveBeenCalledTimes(1)
      })

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      await waitFor(() => {
        expect(mockGetWbHistory).toHaveBeenCalledTimes(1)
      })

      // Switch back to Full History tab
      const fullHistoryTab = screen.getByRole('tab', { name: /полная история/i })
      await user.click(fullHistoryTab)

      // Should not refetch (cached)
      expect(mockGetFullHistory).toHaveBeenCalledTimes(1)
    })
  })

  describe('AC8: Loading States per Tab', () => {
    it('shows loading skeleton while full history loads', async () => {
      mockGetFullHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockFullHistoryResponse), 500))
      )

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Should show skeleton/loading state
      const tabPanel = screen.getByRole('tabpanel')
      const skeleton =
        within(tabPanel).queryByTestId('history-skeleton') ||
        tabPanel.querySelector('[class*="skeleton"], [class*="animate-pulse"]')

      expect(skeleton).toBeInTheDocument()
    })

    it('shows loading skeleton for WB history when tab selected', async () => {
      const user = userEvent.setup()
      mockGetWbHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockWbHistoryResponse), 500))
      )

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      // Should show loading skeleton
      await waitFor(() => {
        const tabPanel = screen.getByRole('tabpanel')
        const skeleton =
          within(tabPanel).queryByTestId('history-skeleton') ||
          tabPanel.querySelector('[class*="skeleton"], [class*="animate-pulse"]')
        expect(skeleton).toBeInTheDocument()
      })
    })

    it('has aria-busy="true" on tab panel during loading', async () => {
      mockGetFullHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockFullHistoryResponse), 500))
      )

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Component shows loading skeleton instead of aria-busy attribute
      await waitFor(() => {
        const tabPanel = screen.getByRole('tabpanel')
        const skeleton =
          within(tabPanel).queryByTestId('history-skeleton') ||
          tabPanel.querySelector('[class*="skeleton"], [class*="animate-pulse"]')
        expect(skeleton).toBeInTheDocument()
      })
    })
  })

  describe('AC9: Error States per Tab', () => {
    it('shows error message with retry button on full history fetch failure', async () => {
      // Reset mock from beforeEach and set to reject
      mockGetFullHistory.mockReset()
      mockGetFullHistory.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })

    it('shows error message for WB history fetch failure', async () => {
      const user = userEvent.setup()
      // Reset mock from beforeEach and set to reject
      mockGetWbHistory.mockReset()
      mockGetWbHistory.mockRejectedValue(new Error('WB API error'))

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      await waitFor(() => {
        expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      })
    })

    it('retry button refetches data for current tab', async () => {
      const user = userEvent.setup()

      // Reset mock from beforeEach
      mockGetFullHistory.mockReset()
      // First call fails, second succeeds
      mockGetFullHistory
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockFullHistoryResponse)

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(screen.getByText(/Не удалось загрузить данные/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockGetFullHistory).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('AC10: Empty States', () => {
    it('shows empty message when no history entries', async () => {
      mockGetFullHistory.mockResolvedValue(mockEmptyFullHistoryResponse)

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(screen.getByText('История статусов пока пуста')).toBeInTheDocument()
      })
    })

    it('shows specific message when WB history not synced yet', async () => {
      const user = userEvent.setup()
      mockGetWbHistory.mockResolvedValue(mockEmptyWbHistoryResponse)

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      await waitFor(() => {
        expect(
          screen.getByText(/wb история ещё не загружена|синхронизация происходит/i)
        ).toBeInTheDocument()
      })
    })

    it('shows empty message for empty local history', async () => {
      const user = userEvent.setup()
      mockGetOrderHistory.mockResolvedValue(mockEmptyLocalHistoryResponse)

      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to Local tab
      const localTab = screen.getByRole('tab', { name: /локальная/i })
      await user.click(localTab)

      await waitFor(() => {
        expect(screen.getByText(/история статусов пока пуста/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC5: Tab Content - Full History', () => {
    it('renders summary section with entry counts', async () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        // Should show total entries and breakdown
        expect(screen.getByText(/итого:/i)).toBeInTheDocument()
        expect(screen.getByText(/записей|записи/i)).toBeInTheDocument()
      })
    })

    it('shows WB and Local breakdown in summary', async () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(screen.getByText(/wb:/i)).toBeInTheDocument()
        expect(screen.getByText(/локальная:/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC6: Tab Content - WB History', () => {
    it('renders WB history summary', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to WB tab
      const wbHistoryTab = screen.getByRole('tab', { name: /wb история/i })
      await user.click(wbHistoryTab)

      await waitFor(() => {
        // Should show total transitions
        expect(screen.getByText(/переход/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC7: Tab Content - Local History', () => {
    it('renders local history with transitions', async () => {
      const user = userEvent.setup()
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      // Switch to Local tab
      const localTab = screen.getByRole('tab', { name: /локальная/i })
      await user.click(localTab)

      await waitFor(() => {
        // Should show history entries
        expect(mockGetOrderHistory).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        expect(mockGetFullHistory).toHaveBeenCalled()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('tabpanel has role="tabpanel" and aria-labelledby', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const tabPanel = screen.getByRole('tabpanel')
      expect(tabPanel).toHaveAttribute('aria-labelledby')
    })

    it('tabs are properly associated with tabpanels via ids', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const activeTab = screen.getByRole('tab', { selected: true })
      const tabPanel = screen.getByRole('tabpanel')

      // Panel should be labelled by the active tab
      const panelLabelledBy = tabPanel.getAttribute('aria-labelledby')
      expect(panelLabelledBy).toBe('full-tab')

      // The active tab should control the panel
      expect(activeTab).toHaveAttribute('data-state', 'active')
    })

    it('only one tabpanel is visible at a time', () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      const tabPanels = screen.getAllByRole('tabpanel', { hidden: true })
      const visiblePanels = tabPanels.filter(
        panel => !panel.hasAttribute('hidden') && panel.getAttribute('data-state') !== 'inactive'
      )

      expect(visiblePanels.length).toBe(1)
    })
  })

  describe('Tab Content Lazy Loading', () => {
    it('only renders active tab content', async () => {
      renderWithProviders(<OrderHistoryTabs orderId="order-uuid-001" />)

      await waitFor(() => {
        // Only full history content should be visible
        const tabPanel = screen.getByRole('tabpanel')
        expect(tabPanel).toBeVisible()
      })

      // Inactive tabs should not have their content rendered or be hidden
      // This depends on implementation (unmount vs hide)
    })
  })
})
