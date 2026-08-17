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

  it('shows loading state initially', { timeout: 5000 }, () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(screen.getByText(/проверка статуса обработки/i)).toBeInTheDocument()
  })

  it('displays processing status with progress bars', { timeout: 5000 }, () => {
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
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(screen.getByText(/парсинг продуктов/i)).toBeInTheDocument()
    expect(screen.getAllByText(/загрузка финансовых отчетов/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/^45\s%$/)).toBeInTheDocument() // ru-RU: "45 %" (NBSP); anchored
    expect(screen.getByText(/^30\s%$/)).toBeInTheDocument()
  })

  it(
    'shows completion message and redirects when processing completes',
    { timeout: 10000 },
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
      } as unknown as ReturnType<typeof useProcessingStatus>)

      renderComponent()

      expect(screen.getByText(/обработка завершена/i)).toBeInTheDocument()

      // Wait for redirect (2 seconds delay in component)
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/dashboard')
        },
        { timeout: 5000 }
      )
    }
  )

  it('displays error state when processing fails', { timeout: 5000 }, () => {
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
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(screen.getByText(/ошибка обработки/i)).toBeInTheDocument()
    expect(screen.getByText(/processing failed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /повторить попытку/i })).toBeInTheDocument()
  })

  it('handles API error state', { timeout: 5000 }, () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(screen.getByText(/ошибка загрузки статуса/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /обновить страницу/i })).toBeInTheDocument()
  })

  it('shows status when no data available', { timeout: 5000 }, () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(screen.getByText(/статус не найден/i)).toBeInTheDocument()
  })

  it(
    'renders no_data CTA and navigates to dashboard on click without auto-redirect',
    { timeout: 5000 },
    async () => {
      const { fireEvent } = await import('@testing-library/react')
      vi.mocked(useProcessingStatus).mockReturnValue({
        data: {
          status: 'no_data',
          productParsing: { progress: 0, status: 'pending' },
          reportLoading: { progress: 0, status: 'pending' },
        },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProcessingStatus>)

      renderComponent()

      const cta = screen.getByRole('button', { name: /перейти к дашборду/i })
      expect(cta).toBeInTheDocument()
      // Neutral copy — must NOT assert "up to date" as fact (Defensive Frontend Principle)
      expect(screen.getByText(/возможно, данные уже актуальны/i)).toBeInTheDocument()

      // No auto-redirect on mount for no_data
      expect(mockPush).not.toHaveBeenCalled()

      fireEvent.click(cta)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    }
  )

  // --- Story 167.6 behavior-lock invariants (presentation migration must not regress these) ---

  it('exposes progressbar semantics with server-provided values', { timeout: 5000 }, () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: {
        status: 'processing',
        productParsing: { progress: 45, status: 'in_progress', taskUuid: 'task-1' },
        reportLoading: { progress: 30, status: 'in_progress', taskUuid: 'task-2' },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveAttribute('aria-valuenow', '45')
    expect(bars[1]).toHaveAttribute('aria-valuenow', '30')
    expect(bars[0]).toHaveAccessibleName('Прогресс парсинга продуктов')
    expect(bars[1]).toHaveAccessibleName('Прогресс загрузки финансовых отчетов')
  })

  it('shows no percentage while initial status is unknown (no misleading zeros)', () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    // Loading state must not render fabricated numeric progress (review F2:
    // anchored pattern — no "N %" text may appear at all while loading)
    expect(screen.queryByText(/^\d+\s*%$/)).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('failed state offers fallback copy, retry, and dashboard navigation', async () => {
    const { fireEvent } = await import('@testing-library/react')
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: {
        status: 'failed',
        productParsing: { progress: 0, status: 'failed', taskUuid: 'task-1' },
        reportLoading: { progress: 0, status: 'failed', taskUuid: 'task-2' },
        error: null,
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    // Fallback copy when server supplies no error message
    expect(screen.getByText(/произошла ошибка при обработке данных/i)).toBeInTheDocument()

    // Retry is a full page reload (recovery path) — click must not throw
    fireEvent.click(screen.getByRole('button', { name: /повторить попытку/i }))

    fireEvent.click(screen.getByRole('button', { name: /перейти на главную/i }))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('completed state redirects to dashboard exactly once across re-renders', async () => {
    vi.mocked(useProcessingStatus).mockReturnValue({
      data: {
        status: 'completed',
        productParsing: { progress: 100, status: 'completed', taskUuid: 'task-1' },
        reportLoading: { progress: 100, status: 'completed', taskUuid: 'task-2' },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProcessingStatus>)

    const view = renderComponent()
    // Re-render with the same completed status must not stack redirects
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <ProcessingStatus />
      </QueryClientProvider>
    )

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      },
      { timeout: 5000 }
    )
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('displays correct status text for each task', { timeout: 5000 }, () => {
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
    } as unknown as ReturnType<typeof useProcessingStatus>)

    renderComponent()

    expect(
      screen.getByText(/парсинг исторических данных за 3 месяца выполняется/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/загрузка финансовых отчетов за 3 месяца ожидает начала/i)
    ).toBeInTheDocument()
  })
})
