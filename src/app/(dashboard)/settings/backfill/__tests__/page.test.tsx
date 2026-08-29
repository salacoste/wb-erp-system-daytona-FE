/**
 * Tests for Backfill Admin Page
 * Story 51.11-FE: Backfill Admin Page - Owner-only page at /settings/backfill
 * Story 123.2-FE: Test backfill — converting TODO stubs to real tests.
 *
 * Owner-only admin page for managing historical data backfill.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { BackfillCabinetStatus } from '@/types/backfill'

// ============================================================================
// Mock Setup
// ============================================================================

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/settings/backfill',
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useBackfillAdmin', () => ({
  useBackfillStatus: vi.fn(),
  useStartBackfill: vi.fn(),
  usePauseBackfill: vi.fn(),
  useResumeBackfill: vi.fn(),
  useRetryBackfill: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useAuth } from '@/hooks/useAuth'
import {
  useBackfillStatus,
  useStartBackfill,
  usePauseBackfill,
  useResumeBackfill,
  useRetryBackfill,
} from '@/hooks/useBackfillAdmin'

// Dynamic import to apply mocks before module evaluation
import BackfillAdminPage from '../page'

const mockUseAuth = vi.mocked(useAuth)
const mockUseBackfillStatus = vi.mocked(useBackfillStatus)
const mockUseStartBackfill = vi.fn()
const mockUsePauseBackfill = vi.fn()
const mockUseResumeBackfill = vi.fn()
const mockUseRetryBackfill = vi.fn()

vi.mocked(useStartBackfill).mockImplementation(mockUseStartBackfill as never)
vi.mocked(usePauseBackfill).mockImplementation(mockUsePauseBackfill as never)
vi.mocked(useResumeBackfill).mockImplementation(mockUseResumeBackfill as never)
vi.mocked(useRetryBackfill).mockImplementation(mockUseRetryBackfill as never)

const baseCabinet = {
  cabinet_id: 'cabinet-1',
  cabinet_name: 'Основной кабинет',
  status: 'idle',
  analytics_status: 'idle',
  data_source: 'report',
  oldest_available_date: null,
  newest_available_date: null,
  progress: null,
  last_error: null,
  started_at: null,
  completed_at: null,
  updated_at: '',
} satisfies BackfillCabinetStatus

function setOwnerUser() {
  mockUseAuth.mockReturnValue({
    user: { id: '1', email: 'owner@test.com', role: 'Owner', name: 'Owner' },
    isAuthenticated: true,
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
}

function setNonOwnerUser(role: string) {
  mockUseAuth.mockReturnValue({
    user: { id: '2', email: `${role}@test.com`, role, name: role },
    isAuthenticated: true,
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
}

function setNoUser() {
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
}

function setStatusQuery(overrides: Partial<ReturnType<typeof useBackfillStatus>>) {
  mockUseBackfillStatus.mockReturnValue({
    data: [] as BackfillCabinetStatus[],
    isLoading: false,
    isFetching: false,
    isError: false,
    isRefetchError: false,
    refetch: vi.fn(),
    dataUpdatedAt: Date.now(),
    ...overrides,
  } as unknown as ReturnType<typeof useBackfillStatus>)
}

type RefetchResult = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useBackfillStatus>['refetch']>>
>

function createDeferredRefetch() {
  let settle!: () => void
  const refetch = vi.fn(
    () => new Promise<RefetchResult>(resolve => (settle = () => resolve({} as RefetchResult)))
  )
  return { refetch, settle: () => settle() }
}

function setLoadedStatus(cabinets: BackfillCabinetStatus[] = []) {
  setStatusQuery({ data: cabinets })

  mockUseStartBackfill.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useStartBackfill>)

  mockUsePauseBackfill.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof usePauseBackfill>)

  mockUseResumeBackfill.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useResumeBackfill>)

  mockUseRetryBackfill.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useRetryBackfill>)
}

function renderPage() {
  const queryClient = createTestQueryClient()
  const Wrapper = createQueryWrapper(queryClient)
  return render(<BackfillAdminPage />, { wrapper: Wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()
  setOwnerUser()
  setLoadedStatus()
})

// ============================================================================
// Access Control Tests (AC1)
// ============================================================================

describe('BackfillAdminPage - Access Control', () => {
  it('should render page for Owner users', () => {
    renderPage()
    expect(screen.getByText('Управление бэкфиллом')).toBeInTheDocument()
  })

  it.each(['Manager', 'Analyst', 'Service'])('should redirect %s users to /dashboard', role => {
    setNonOwnerUser(role)
    setLoadedStatus()
    renderPage()
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show loading skeleton while auth is loading (no user)', () => {
    setNoUser()
    setLoadedStatus()
    renderPage()
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Page Header & Layout Tests (AC2)
// ============================================================================

describe('BackfillAdminPage - Header & Layout', () => {
  it('should render page title "Управление бэкфиллом"', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Управление бэкфиллом')
  })

  it('should not render a nested main landmark inside the dashboard shell', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('main')).toHaveLength(0)
    expect(container.querySelector('section.min-h-screen')).not.toBeInTheDocument()
  })

  it('should render page subtitle with description', () => {
    renderPage()
    expect(screen.getByText(/Загрузка исторических данных FBS/i)).toBeInTheDocument()
  })

  it('should render breadcrumbs: Главная > Настройки > Бэкфилл', () => {
    renderPage()
    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
    expect(screen.getByText('Бэкфилл')).toBeInTheDocument()
  })

  it('should render breadcrumb links', () => {
    renderPage()
    expect(screen.getByText('Главная').closest('a')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Настройки').closest('a')).toHaveAttribute('href', '/settings')
  })
})

// ============================================================================
// Actions Bar Tests (AC4)
// ============================================================================

describe('BackfillAdminPage - Actions Bar', () => {
  it('should render "Запустить бэкфилл" button', () => {
    renderPage()
    expect(screen.getByText('Запустить бэкфилл')).toBeInTheDocument()
  })

  it('should render "Обновить" refresh button', () => {
    renderPage()
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('does not announce automatic polling as a user-requested refresh', () => {
    setStatusQuery({ data: [baseCabinet], isFetching: true })

    renderPage()

    expect(screen.getByRole('button', { name: 'Обновить' })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('status')).not.toHaveTextContent('Обновление данных')
  })

  it('should show last updated timestamp when data loaded', () => {
    renderPage()
    expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
  })

  it('keeps the pending start trigger focusable while guarding repeated activation', async () => {
    const user = userEvent.setup()
    mockUseStartBackfill.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useStartBackfill>)

    renderPage()
    const startButton = screen.getByRole('button', { name: 'Запустить бэкфилл' })
    expect(startButton).not.toBeDisabled()
    expect(startButton).toHaveAttribute('aria-disabled', 'true')
    await user.click(startButton)
    expect(screen.queryByRole('dialog', { name: 'Запуск бэкфилла' })).not.toBeInTheDocument()
  })

  it('should return focus to the start button after the controlled dialog closes', async () => {
    const user = userEvent.setup()
    renderPage()
    const startButton = screen.getByRole('button', { name: 'Запустить бэкфилл' })

    await user.click(startButton)
    expect(screen.getByRole('dialog', { name: 'Запуск бэкфилла' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Запуск бэкфилла' })).not.toBeInTheDocument()
    expect(startButton).toHaveFocus()
  })
})

describe('BackfillAdminPage - Query truth states', () => {
  it('does not present unknown initial data as a zero-valued summary', () => {
    setStatusQuery({ data: undefined, isLoading: true, isFetching: true, dataUpdatedAt: 0 })

    const { container } = renderPage()

    expect(screen.getByRole('heading', { name: 'Загружаем состояние бэкфилла' })).toBeVisible()
    expect(screen.getByText('Данные ещё не получены')).toBeVisible()
    expect(screen.getByText('Получаем данные')).toBeVisible()
    expect(screen.queryByText('Нет кабинетов для бэкфилла')).not.toBeInTheDocument()
    expect(container.querySelector('[data-context-id="custom:completed-pipelines"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Обновить' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запустить бэкфилл' })).toBeDisabled()
  })

  it('keeps a paused first query unresolved when no data has ever arrived', () => {
    setStatusQuery({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isPending: true,
      isPaused: true,
      dataUpdatedAt: 0,
    })

    const { container } = renderPage()

    expect(screen.getByRole('heading', { name: 'Загружаем состояние бэкфилла' })).toBeVisible()
    expect(screen.queryByText('Нет кабинетов для бэкфилла')).not.toBeInTheDocument()
    expect(container.querySelector('[data-context-id="custom:completed-pipelines"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Обновить' })).not.toBeInTheDocument()
  })

  it('presents a successful empty response as real zero counts and an empty list', () => {
    setStatusQuery({ data: [], dataUpdatedAt: 1_788_000_000_000 })

    const { container } = renderPage()

    expect(screen.getByText('Нет кабинетов для бэкфилла')).toBeVisible()
    expect(
      container.querySelector('[data-context-id="custom:completed-pipelines"]')
    ).toHaveTextContent('Завершено источников0')
    expect(
      container.querySelector('[data-context-id="custom:failed-pipelines"]')
    ).toHaveTextContent('С ошибкой источников0')
  })

  it('retains usable cabinets while a background refresh is running', () => {
    setStatusQuery({ data: [baseCabinet], isFetching: true })

    renderPage()

    expect(screen.getAllByText(baseCabinet.cabinet_name)).not.toHaveLength(0)
    expect(screen.queryByText('Обновление данных')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Обновить' })).not.toHaveAttribute('aria-disabled')
  })

  it('announces one explicit refresh and locks the control until its promise settles', async () => {
    const user = userEvent.setup()
    const deferred = createDeferredRefetch()
    setStatusQuery({ data: [baseCabinet], isFetching: true, refetch: deferred.refetch })

    renderPage()
    await user.click(screen.getByRole('button', { name: 'Обновить' }))

    const refresh = screen.getByRole('button', { name: 'Обновить — выполняется' })
    expect(screen.getByText('Обновление данных')).toBeVisible()
    expect(refresh).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(refresh)
    expect(deferred.refetch).toHaveBeenCalledTimes(1)

    await act(async () => deferred.settle())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Обновить' })).toBeEnabled())
  })

  it('shows an explicit initial failure and retries without fabricating an empty result', async () => {
    const user = userEvent.setup()
    const deferred = createDeferredRefetch()
    setStatusQuery({
      data: undefined,
      isError: true,
      isRefetchError: false,
      refetch: deferred.refetch,
      dataUpdatedAt: 0,
    })

    const { container } = renderPage()

    expect(
      screen.getByRole('heading', { name: 'Не удалось загрузить состояние бэкфилла' })
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Сервер не вернул статусы кабинетов')
    expect(screen.queryByText('Нет кабинетов для бэкфилла')).not.toBeInTheDocument()
    expect(container.querySelector('[data-context-id="custom:completed-pipelines"]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
    expect(deferred.refetch).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Загрузка…' })).toBeDisabled()
    expect(screen.getByText('Обновление данных')).toBeVisible()

    await act(async () => deferred.settle())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Повторить загрузку' })).toBeEnabled()
    )
  })

  it('retains cabinets and marks them stale after a background refresh failure', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    setStatusQuery({
      data: [baseCabinet],
      isError: true,
      isRefetchError: true,
      refetch,
      dataUpdatedAt: 1_788_000_000_000,
    })

    renderPage()

    expect(
      screen.getByRole('region', { name: 'Показаны ранее полученные данные' })
    ).toHaveAttribute('data-state', 'stale')
    expect(screen.getAllByText(baseCabinet.cabinet_name)).not.toHaveLength(0)
    expect(screen.getByText('Данные требуют обновления')).toBeVisible()
    expect(screen.getByText(/Текущие статусы могли измениться/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Обновить' })).not.toHaveAttribute('aria-disabled')
    await user.click(screen.getByRole('button', { name: 'Повторить обновление' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('guards a retained-error retry tuple without announcing automatic fetching as live', () => {
    const refetch = vi.fn()
    setStatusQuery({
      data: [baseCabinet],
      isFetching: true,
      isError: true,
      isRefetchError: true,
      refetch,
    })

    renderPage()

    expect(screen.getAllByText(baseCabinet.cabinet_name)).not.toHaveLength(0)
    expect(screen.getByText(/Текущие статусы могли измениться/)).toBeVisible()
    const contextRefresh = screen.queryByRole('button', { name: 'Обновить' })
    const staleRetry = screen.getByRole('button', { name: 'Обновление…' })
    expect(contextRefresh).not.toBeInTheDocument()
    expect(screen.queryByText('Обновление данных')).not.toBeInTheDocument()
    expect(staleRetry).toBeDisabled()
    expect(staleRetry).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(staleRetry)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('locks both stale-state refresh controls during an explicit retry', async () => {
    const user = userEvent.setup()
    const deferred = createDeferredRefetch()
    setStatusQuery({
      data: [baseCabinet],
      isError: true,
      isRefetchError: true,
      refetch: deferred.refetch,
    })

    renderPage()
    await user.click(screen.getByRole('button', { name: 'Повторить обновление' }))

    const contextRefresh = screen.getByRole('button', { name: 'Обновить — выполняется' })
    const staleRetry = screen.getByRole('button', { name: 'Обновление…' })
    expect(contextRefresh).toHaveAttribute('aria-disabled', 'true')
    expect(staleRetry).toBeDisabled()
    expect(screen.getByText('Обновление данных')).toBeVisible()
    fireEvent.click(contextRefresh)
    fireEvent.click(staleRetry)
    expect(deferred.refetch).toHaveBeenCalledTimes(1)

    await act(async () => deferred.settle())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Повторить обновление' })).toBeEnabled()
    )
  })
})

describe('BackfillAdminPage - Durable job summaries', () => {
  it('explains that queued or running work continues after leaving the page', () => {
    setLoadedStatus([{ ...baseCabinet, status: 'in_progress', analytics_status: 'pending' }])

    renderPage()

    expect(
      screen.getByText('Загрузка продолжится в фоне — страницу можно безопасно закрыть.')
    ).toHaveClass('text-status-information')
  })

  it.each([
    ['completed', 'failed', 1, 0, 0, 1],
    ['failed', 'completed', 1, 0, 0, 1],
    ['in_progress', 'failed', 0, 1, 0, 1],
    ['paused', 'completed', 1, 0, 1, 0],
  ] as const)(
    'keeps pipeline truth for reports=%s and analytics=%s',
    (status, analyticsStatus, completed, active, paused, failed) => {
      setLoadedStatus([{ ...baseCabinet, status, analytics_status: analyticsStatus }])

      const { container } = renderPage()

      expect(
        container.querySelector('[data-context-id="custom:completed-pipelines"]')
      ).toHaveTextContent(`Завершено источников${completed}`)
      expect(
        container.querySelector('[data-context-id="custom:active-pipelines"]')
      ).toHaveTextContent(`В работе источников${active}`)
      expect(
        container.querySelector('[data-context-id="custom:paused-pipelines"]')
      ).toHaveTextContent(`На паузе источников${paused}`)
      expect(
        container.querySelector('[data-context-id="custom:failed-pipelines"]')
      ).toHaveTextContent(`С ошибкой источников${failed}`)
    }
  )
})

// ============================================================================
// Empty State Tests
// ============================================================================

describe('BackfillAdminPage - Empty State', () => {
  it('should render page with empty cabinet list', () => {
    setLoadedStatus([])
    renderPage()
    expect(screen.getByText('Управление бэкфиллом')).toBeInTheDocument()
  })
})
