import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProcessingStatus } from './ProcessingStatus'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/hooks/useProcessingStatus')
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('ProcessingStatus', () => {
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
    vi.useRealTimers()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProcessingStatus />
      </QueryClientProvider>
    )
  }

  it(
    'shows loading state initially',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      renderComponent()

      expect(screen.getByText(/проверка статуса обработки/i)).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays processing status with progress bars',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: {
          status: 'processing',
          productParsing: {
            progress: 45,
            status: 'in_progress',
            taskUuid: 'task-1',
          },
          reportLoading: {
            progress: 30,
            status: 'in_progress',
            taskUuid: 'task-2',
          },
        },
        isLoading: false,
        error: null,
      } as any)

      renderComponent()

      expect(screen.getByText(/парсинг продуктов/i)).toBeInTheDocument()
      expect(
        screen.getAllByText(/загрузка финансовых отчетов/i)[0],
      ).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('30%')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'shows completion message and redirects when processing completes',
    async () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: {
          status: 'completed',
          productParsing: {
            progress: 100,
            status: 'completed',
            taskUuid: 'task-1',
          },
          reportLoading: {
            progress: 100,
            status: 'completed',
            taskUuid: 'task-2',
          },
        },
        isLoading: false,
        error: null,
      } as any)

      renderComponent()

      expect(
        screen.getByText(/обработка завершена/i),
      ).toBeInTheDocument()

      // Wait for redirect (2 seconds delay in component)
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/dashboard')
        },
        { timeout: 5000 },
      )
    },
    { timeout: 10000 },
  )

  it(
    'displays error state when processing fails',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: {
          status: 'failed',
          productParsing: {
            progress: 0,
            status: 'failed',
            taskUuid: 'task-1',
          },
          reportLoading: {
            progress: 0,
            status: 'failed',
            taskUuid: 'task-2',
          },
          error: 'Processing failed',
        },
        isLoading: false,
        error: null,
      } as any)

      renderComponent()

      expect(screen.getByText(/ошибка обработки/i)).toBeInTheDocument()
      expect(screen.getByText(/processing failed/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /повторить попытку/i }),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'handles API error state',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as any)

      renderComponent()

      expect(screen.getByText(/ошибка загрузки статуса/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /обновить страницу/i }),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'shows status when no data available',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      renderComponent()

      expect(screen.getByText(/статус не найден/i)).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays correct status text for each task',
    () => {
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: {
          status: 'processing',
          productParsing: {
            progress: 50,
            status: 'in_progress',
            taskUuid: 'task-1',
          },
          reportLoading: {
            progress: 25,
            status: 'pending',
            taskUuid: 'task-2',
          },
        },
        isLoading: false,
        error: null,
      } as any)

      renderComponent()

      expect(
        screen.getByText(/парсинг исторических данных за 3 месяца выполняется/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/загрузка финансовых отчетов за 3 месяца ожидает начала/i),
      ).toBeInTheDocument()
    },
    { timeout: 5000 },
  )
})

