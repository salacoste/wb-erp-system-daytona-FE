import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FunnelTable } from '../FunnelTable'

const useFunnelDataMock = vi.fn()

vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelData: (...args: unknown[]) => useFunnelDataMock(...args),
}))

describe('FunnelTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces long-loading skeleton with an explicit retry state', () => {
    vi.useFakeTimers()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText(/Таблица воронки загружается дольше обычного/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })
})
