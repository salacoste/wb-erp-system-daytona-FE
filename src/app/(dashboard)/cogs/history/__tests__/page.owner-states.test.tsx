import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CogsHistoryPage from '../page'

const mocks = vi.hoisted(() => ({
  useCogsHistoryFull: vi.fn(),
  useCogsHistoryPageState: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('nmId=12345678'),
}))

vi.mock('@/hooks/useCogsHistoryFull', () => ({
  useCogsHistoryFull: (...args: unknown[]) => mocks.useCogsHistoryFull(...args),
}))

vi.mock('../useCogsHistoryPageState', () => ({
  useCogsHistoryPageState: () => mocks.useCogsHistoryPageState(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'Analyst' } }),
}))

const historyItem = {
  cogs_id: 'cogs-1',
  nm_id: '12345678',
  unit_cost_rub: 450,
  currency: 'RUB',
  valid_from: '2026-01-01',
  valid_to: null,
  source: 'manual' as const,
  notes: 'Текущая версия',
  created_by: 'owner-1',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  is_active: true,
  affected_weeks: ['2026-W01'],
}

const response = {
  data: [historyItem],
  meta: {
    nm_id: '12345678',
    product_name: 'Тестовый товар',
    current_cogs: { unit_cost_rub: 450, valid_from: '2026-01-01' },
    total_versions: 1,
  },
  pagination: { total: 1, cursor: null, has_more: false },
}

describe('CogsHistoryPage owner states', () => {
  const handlePreviousPage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useCogsHistoryPageState.mockReturnValue({
      cursor: undefined,
      includeDeleted: false,
      limit: 25,
      handlePreviousPage,
      handleNextPage: vi.fn(),
      handleIncludeDeletedChange: vi.fn(),
      hasPrevious: false,
      hasNext: vi.fn(() => false),
    })
    mocks.useCogsHistoryFull.mockReturnValue({
      data: response,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders a truthful filtered-empty history result', async () => {
    const user = userEvent.setup()
    mocks.useCogsHistoryPageState.mockReturnValue({
      cursor: 'next-page',
      includeDeleted: false,
      limit: 25,
      handlePreviousPage,
      handleNextPage: vi.fn(),
      handleIncludeDeletedChange: vi.fn(),
      hasPrevious: true,
      hasNext: vi.fn(() => false),
    })
    mocks.useCogsHistoryFull.mockReturnValue({
      data: { ...response, data: [], pagination: { total: 1, cursor: null, has_more: false } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CogsHistoryPage />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Нет записей на выбранной странице истории' })
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'К предыдущей странице' }))
    expect(handlePreviousPage).toHaveBeenCalledOnce()
  })

  it('keeps retained history rows identifiable while refresh evidence is stale', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    mocks.useCogsHistoryFull.mockReturnValue({
      data: response,
      isLoading: false,
      isError: true,
      error: new Error('refresh failed'),
      refetch,
    })

    render(<CogsHistoryPage />)

    expect(screen.getByRole('alert')).toHaveTextContent('Показаны последние доступные данные')
    expect(
      screen.getByRole('table', { name: 'История себестоимости — Тестовый товар' })
    ).toBeVisible()
    expect(screen.getByText('Текущая версия')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
