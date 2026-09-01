/**
 * OrdersIntegrityPageContent Unit Tests
 *
 * Verifies page-level orchestration:
 * - Renders page title and description
 * - Shows skeleton during loading
 * - Shows error alert when fetch fails
 * - Renders child components when data is available
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrdersIntegrityPageContent } from '../OrdersIntegrityPageContent'

// Default mock: data loaded successfully
const mockUseOrdersIntegrity = vi.fn()

vi.mock('@/hooks/use-orders-integrity', () => ({
  useOrdersIntegrity: (...args: unknown[]) => mockUseOrdersIntegrity(...args),
}))

vi.mock('@/hooks/use-orders-reconciliation', () => ({
  useOrdersReconciliation: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

// Mock DateRangePickerExtended to avoid Radix Portal issues in jsdom
vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: () => <div data-testid="date-range-picker" />,
}))

const integrityData = {
  status: 'healthy' as const,
  checks: {
    duplicates: { status: 'pass' as const, count: 0 },
    orphans: { status: 'pass' as const, count: 0 },
    missing_history: { status: 'pass' as const, count: 0 },
    duplicate_status_history: { status: 'pass' as const, count: 0 },
    invalid_transitions: { status: 'pass' as const, count: 0 },
    sync_overlaps: { status: 'pass' as const, count: 0 },
  },
  lastCheck: '2025-06-01T12:00:00Z',
  durationMs: 1500,
}

describe('OrdersIntegrityPageContent', () => {
  it('renders page title and description', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: integrityData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByText('Целостность заказов')).toBeInTheDocument()
    expect(screen.getByText(/Проверка целостности данных заказов/)).toBeInTheDocument()
  })

  it('shows skeleton when loading with no cached data', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows error alert when fetch fails', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByText(/Не удалось загрузить данные проверки/)).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('renders IntegrityStatusCard when data is available', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: integrityData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByText('Данные в порядке')).toBeInTheDocument()
  })

  it('renders IntegrityChecksGrid when data is available', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: integrityData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByText('Дубликаты')).toBeInTheDocument()
    expect(screen.getByText('Сироты')).toBeInTheDocument()
  })

  it('keeps cached integrity evidence visible after a refresh failure', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: integrityData,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)

    expect(screen.getByText(/Показаны последние доступные результаты/)).toBeVisible()
    expect(screen.getByText('Данные в порядке')).toBeVisible()
    expect(screen.getByText('Дубликаты')).toBeVisible()
  })

  it('renders the page container with testid', () => {
    mockUseOrdersIntegrity.mockReturnValue({
      data: integrityData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    })
    renderWithProviders(<OrdersIntegrityPageContent />)
    expect(screen.getByTestId('orders-integrity-page')).toBeInTheDocument()
  })
})
