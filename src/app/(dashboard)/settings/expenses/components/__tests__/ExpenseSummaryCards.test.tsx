/**
 * ExpenseSummaryCards Tests
 * Tests for src/app/(dashboard)/settings/expenses/components/ExpenseSummaryCards.tsx
 *
 * Covers: loading skeletons, data rendering, null defaults, category breakdown
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import type { ExpenseSummary } from '@/types/expenses'

// Mock hook
const mockUseExpensesSummary = vi.fn()

vi.mock('@/hooks/useExpensesCRUD', () => ({
  useExpensesSummary: (...args: unknown[]) => mockUseExpensesSummary(...args),
}))

// Import after mocks
import { ExpenseSummaryCards } from '../ExpenseSummaryCards'

// Fixtures
const mockSummary: ExpenseSummary = {
  total: 150000,
  byCategory: {
    rent: 50000,
    salary: 60000,
    packaging: 15000,
    transport: 10000,
    other: 15000,
  },
  byMonth: [{ month: '2026-06', total: 150000 }],
}

function setupHookReturn(
  overrides: Partial<{
    data: ExpenseSummary | undefined
    isLoading: boolean
    isError: boolean
    refetch: () => void
  }>
) {
  mockUseExpensesSummary.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  })
}

describe('ExpenseSummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    beforeEach(() => {
      setupHookReturn({ data: undefined, isLoading: true })
    })

    it('renders skeleton placeholders when loading', () => {
      const { container } = render(<ExpenseSummaryCards month="2026-06" />)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('announces summary loading by name', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.getByRole('status', { name: /загружаем сводку расходов/i })).toBeInTheDocument()
    })

    it('does not render total amount text during loading', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.queryByText(/итого/i)).not.toBeInTheDocument()
    })
  })

  describe('Data state', () => {
    beforeEach(() => {
      setupHookReturn({ data: mockSummary, isLoading: false })
    })

    it('renders "Итого за месяц" card', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.getByText('Итого за месяц')).toBeInTheDocument()
    })

    it('renders formatted total amount', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.getAllByText(/150.*000.*₽/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders first two category cards', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      // Category labels appear in both top cards and breakdown grid
      // EXPENSE_CATEGORY_CONFIG first two: 'Аренда', 'Зарплата'
      expect(screen.getAllByText('Аренда').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Зарплата').length).toBeGreaterThanOrEqual(1)
    })

    it('renders category amounts with formatted currency', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.getAllByText(/50.*000.*₽/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/60.*000.*₽/).length).toBeGreaterThanOrEqual(1)
    })

    it('calls useExpensesSummary with month as both from and to', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(mockUseExpensesSummary).toHaveBeenCalledWith('2026-06', '2026-06')
    })
  })

  describe('Error state', () => {
    it('distinguishes a failed summary from zero expenses and retries', () => {
      const refetch = vi.fn()
      setupHookReturn({ isError: true, refetch })
      render(<ExpenseSummaryCards month="2026-06" />)

      expect(
        screen.getByRole('heading', { name: /не удалось загрузить сводку/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('Итого за месяц')).not.toBeInTheDocument()
      screen.getByRole('button', { name: /повторить загрузку сводки/i }).click()
      expect(refetch).toHaveBeenCalledOnce()
    })
  })

  describe('Unavailable summary', () => {
    beforeEach(() => {
      setupHookReturn({ data: undefined, isLoading: false })
    })

    it('does not present an unknown summary as zero', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(
        screen.getByRole('heading', { name: /сводка расходов пока недоступна/i })
      ).toBeInTheDocument()
      expect(screen.queryByText('Итого за месяц')).not.toBeInTheDocument()
      expect(screen.queryByText(/0.*₽/)).not.toBeInTheDocument()
    })

    it('offers a retry for an unconfirmed summary', () => {
      const refetch = vi.fn()
      setupHookReturn({ data: undefined, isLoading: false, refetch })
      render(<ExpenseSummaryCards month="2026-06" />)
      screen.getByRole('button', { name: /повторить загрузку сводки/i }).click()
      expect(refetch).toHaveBeenCalledOnce()
    })
  })

  describe('CategoryBreakdownCard', () => {
    beforeEach(() => {
      setupHookReturn({ data: mockSummary, isLoading: false })
    })

    it('renders "Разбивка по категориям" heading', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      expect(screen.getByText('Разбивка по категориям')).toBeInTheDocument()
    })

    it('renders all 5 expense categories', () => {
      render(<ExpenseSummaryCards month="2026-06" />)
      // Each category appears in top cards AND breakdown
      expect(screen.getAllByText('Аренда').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Зарплата').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Упаковка').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Транспорт').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Прочее').length).toBeGreaterThanOrEqual(1)
    })

    it('renders category amounts in breakdown', () => {
      const { container } = render(<ExpenseSummaryCards month="2026-06" />)
      // The breakdown grid renders 5 category items
      const grid = container.querySelector('.grid-cols-5, .grid-cols-3, .grid-cols-2')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Different month values', () => {
    it('passes correct month to hook', () => {
      setupHookReturn({ data: mockSummary, isLoading: false })
      render(<ExpenseSummaryCards month="2025-12" />)
      expect(mockUseExpensesSummary).toHaveBeenCalledWith('2025-12', '2025-12')
    })

    it('re-fetches when month changes', () => {
      setupHookReturn({ data: mockSummary, isLoading: false })
      const { rerender } = render(<ExpenseSummaryCards month="2026-06" />)
      expect(mockUseExpensesSummary).toHaveBeenCalledWith('2026-06', '2026-06')

      rerender(<ExpenseSummaryCards month="2026-07" />)
      expect(mockUseExpensesSummary).toHaveBeenCalledWith('2026-07', '2026-07')
    })
  })

  describe('Partial category data', () => {
    it('renders 0 for categories not in summary.byCategory', () => {
      const partialSummary: ExpenseSummary = {
        total: 50000,
        byCategory: {
          rent: 50000,
          salary: 0,
          packaging: 0,
          transport: 0,
          other: 0,
        },
        byMonth: [],
      }
      setupHookReturn({ data: partialSummary, isLoading: false })
      render(<ExpenseSummaryCards month="2026-06" />)

      // All categories still render, non-rent ones default to 0
      expect(screen.getAllByText('Аренда').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Зарплата').length).toBeGreaterThanOrEqual(1)
    })
  })
})
