import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InitialDataSummary } from './InitialDataSummary'
import { useProductsCount } from '@/hooks/useProducts'
import { useDashboardMetrics } from '@/hooks/useDashboard'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/hooks/useProducts', () => ({
  useProductsCount: vi.fn(),
}))

vi.mock('@/hooks/useDashboard', () => ({
  useDashboardMetrics: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('InitialDataSummary', () => {
  let queryClient: QueryClient
  const mockPush = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InitialDataSummary />
      </QueryClientProvider>
    )
  }

  it(
    'shows loading state initially',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)

      renderComponent()

      expect(screen.getByText(/загрузка данных/i)).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays product count when data is loaded',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: 1234,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {},
        isLoading: false,
      } as any)

      renderComponent()

      expect(screen.getByText(/товары/i)).toBeInTheDocument()
      expect(screen.getByText('1 234')).toBeInTheDocument()
      expect(
        screen.getByText(/товаров загружено из wildberries/i),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays financial metrics when available',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: 500,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {
          totalPayable: 1000000,
          revenue: 1500000,
        },
        isLoading: false,
      } as any)

      renderComponent()

      expect(screen.getByText(/финансовые показатели/i)).toBeInTheDocument()
      expect(screen.getByText(/к перечислению за товар/i)).toBeInTheDocument()
      expect(screen.getByText(/вайлдберриз реализовал товар/i)).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'shows success message when data is loaded',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: 100,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {},
        isLoading: false,
      } as any)

      renderComponent()

      expect(
        screen.getByText(/данные успешно загружены/i),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays call-to-action for COGS assignment',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: 100,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {},
        isLoading: false,
      } as any)

      renderComponent()

      expect(screen.getByText(/следующий шаг/i)).toBeInTheDocument()
      expect(
        screen.getByText(/назначить себестоимость товаров/i),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /назначить cogs/i }),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'navigates to COGS page when button is clicked',
    async () => {
      const user = userEvent.setup()
      vi.mocked(useProductsCount).mockReturnValue({
        data: 100,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {},
        isLoading: false,
      } as any)

      renderComponent()

      const cogsButton = screen.getByRole('button', { name: /назначить cogs/i })
      await user.click(cogsButton)

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/cogs')
        },
        { timeout: 3000 },
      )
    },
    { timeout: 10000 },
  )

  it(
    'shows empty state when no data is available',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any)

      renderComponent()

      expect(
        screen.getByText(/данные еще не загружены/i),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'formats currency correctly',
    () => {
      vi.mocked(useProductsCount).mockReturnValue({
        data: 100,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {
          totalPayable: 1234567.89,
          revenue: 2345678.9,
        },
        isLoading: false,
      } as any)

      renderComponent()

      // Check that currency is formatted (should contain ₽ or руб)
      const payableText = screen.getByText(/к перечислению за товар/i)
        .parentElement?.textContent
      expect(payableText).toMatch(/₽|руб/i)
    },
    { timeout: 5000 },
  )

  it(
    'navigates to dashboard when "Go to main" button is clicked',
    async () => {
      const user = userEvent.setup()
      vi.mocked(useProductsCount).mockReturnValue({
        data: 100,
        isLoading: false,
      } as any)
      vi.mocked(useDashboardMetrics).mockReturnValue({
        data: {},
        isLoading: false,
      } as any)

      renderComponent()

      const dashboardButton = screen.getByRole('button', {
        name: /перейти на главную/i,
      })
      await user.click(dashboardButton)

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/dashboard')
        },
        { timeout: 3000 },
      )
    },
    { timeout: 10000 },
  )
})

