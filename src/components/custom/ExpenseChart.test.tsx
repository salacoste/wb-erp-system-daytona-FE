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
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
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

    await waitFor(() => {
      expect(screen.getByText('Разбивка расходов')).toBeInTheDocument()
      expect(screen.getByText('Визуализация расходов по категориям')).toBeInTheDocument()
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

    await waitFor(() => {
      expect(screen.getByText('Разбивка расходов')).toBeInTheDocument()
    })

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
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

    await waitFor(() => {
      expect(
        screen.getByText('Не удалось загрузить данные о расходах. Пожалуйста, попробуйте еще раз.'),
      ).toBeInTheDocument()
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
      expect(
        screen.getByText(
          'Данные о расходах пока недоступны. Расходы появятся после загрузки финансовых отчетов.',
        ),
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

