import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExpenseChart } from './ExpenseChart'
import { useExpenses } from '@/hooks/useExpenses'
import type { ExpenseBreakdown } from '@/hooks/useExpenses'

// Mock the useExpenses hook
vi.mock('@/hooks/useExpenses')

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  // Added 2026-04-07: redesigned ExpenseChart imports LabelList; without this
  // mock the success-state tests crash with "Element type is invalid: undefined".
  LabelList: () => <div data-testid="label-list" />,
}))

describe('ExpenseChart', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockExpenseData: ExpenseBreakdown = {
    expenses: [
      {
        category: 'Логистика',
        amount: 50000,
        percentage: 50,
      },
      {
        category: 'Хранение',
        amount: 30000,
        percentage: 30,
      },
      {
        category: 'Штрафы',
        amount: 20000,
        percentage: 20,
      },
    ],
    total: 100000,
  }

  it('renders chart with expense data', { timeout: 5000 }, async () => {
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockExpenseData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ExpenseChart />, { wrapper })

    // Updated 2026-04-07: redesigned card no longer renders a CardDescription —
    // the title is paired with an ExpenseSummaryBadge instead. Only the title
    // and bar chart container remain in the success state header.
    await waitFor(() => {
      expect(screen.getByText('Разбивка расходов')).toBeInTheDocument()
    })

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('displays loading skeleton when isLoading is true', { timeout: 5000 }, async () => {
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<ExpenseChart />, { wrapper })

    // Skeleton is rendered without card title (uses ExpenseChartSkeleton component)
    await waitFor(() => {
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    // Check for aria-busy attribute
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('displays error message with retry button when error occurs', { timeout: 5000 }, async () => {
    const mockRefetch = vi.fn()
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    })

    render(<ExpenseChart />, { wrapper })

    // Updated 2026-04-07: redesigned error Alert uses a shorter message
    // "Не удалось загрузить данные о расходах." (without the trailing
    // "Пожалуйста, попробуйте еще раз." sentence). The retry button is now
    // inline within the AlertDescription's flex container.
    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить данные о расходах.')).toBeInTheDocument()
      expect(screen.getByText('Повторить')).toBeInTheDocument()
    })
  })

  it('displays empty state message when no expense data', { timeout: 5000 }, async () => {
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { expenses: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ExpenseChart />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Нет данных за этот период')).toBeInTheDocument()
      expect(
        screen.getByText('Данные о расходах появятся после загрузки финансовых отчетов')
      ).toBeInTheDocument()
    })
  })

  it('renders chart with correct structure when data is available', { timeout: 5000 }, async () => {
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockExpenseData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ExpenseChart />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })
  })

  it('calls refetch when retry button is clicked', { timeout: 5000 }, async () => {
    const mockRefetch = vi.fn()
    ;(useExpenses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    })

    render(<ExpenseChart />, { wrapper })

    await waitFor(() => {
      const retryButton = screen.getByText('Повторить')
      expect(retryButton).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Повторить')
    retryButton.click()

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})
