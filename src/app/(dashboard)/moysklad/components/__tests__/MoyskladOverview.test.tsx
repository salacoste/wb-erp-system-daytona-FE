import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MoyskladOverview } from '../MoyskladOverview'

const mocks = vi.hoisted(() => ({
  useMoyskladHealth: vi.fn(),
  useMoyskladMappings: vi.fn(),
}))

vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladHealth: () => mocks.useMoyskladHealth(),
  useMoyskladMappings: (...args: unknown[]) => mocks.useMoyskladMappings(...args),
}))

vi.mock('@/hooks/useMoyskladSync', () => ({
  useMoyskladSync: () => ({
    sync: vi.fn(),
    isSyncing: false,
    canSync: true,
    lastSyncAt: null,
    rateLimitCountdown: 0,
    status: 'idle',
    error: null,
  }),
}))

describe('MoyskladOverview', () => {
  beforeEach(() => {
    mocks.useMoyskladHealth.mockReturnValue({
      data: { status: 'ok', readOnly: true, tokenConfigured: true },
      isLoading: false,
      isError: false,
    })
    mocks.useMoyskladMappings.mockReturnValue({
      data: { total: 0, rows: [] },
      isLoading: false,
      isError: false,
    })
  })

  it('renders all count and connection skeletons while Moysklad overview queries are loading', () => {
    mocks.useMoyskladHealth.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mocks.useMoyskladMappings.mockReturnValue({ data: undefined, isLoading: true, isError: false })

    const { container } = render(<MoyskladOverview />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
    expect(screen.queryByText(/^Статус:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Токен:/)).not.toBeInTheDocument()
  })

  it('keeps healthy overview evidence visible when one independent source fails', () => {
    mocks.useMoyskladMappings
      .mockReturnValueOnce({ data: { total: 12, rows: [] }, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true })
      .mockReturnValueOnce({ data: { total: 20, rows: [] }, isLoading: false, isError: false })

    render(<MoyskladOverview />)

    expect(screen.getByRole('alert')).toHaveTextContent('Часть данных обзора недоступна')
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('20')).toBeVisible()
    expect(screen.getByText('Недоступно')).toBeVisible()
    expect(screen.queryAllByText('0')).toHaveLength(0)
  })

  it('keeps retained overview evidence visible after a background refresh failure', () => {
    mocks.useMoyskladMappings
      .mockReturnValueOnce({ data: { total: 12, rows: [] }, isLoading: false, isError: true })
      .mockReturnValueOnce({ data: { total: 8, rows: [] }, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: { total: 20, rows: [] }, isLoading: false, isError: false })

    render(<MoyskladOverview />)

    expect(screen.getByRole('alert')).toHaveTextContent('Показаны последние доступные данные')
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('8')).toBeVisible()
    expect(screen.getByText('20')).toBeVisible()
  })
})
