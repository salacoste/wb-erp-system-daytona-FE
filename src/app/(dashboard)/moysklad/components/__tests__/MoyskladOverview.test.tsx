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
    })
    mocks.useMoyskladMappings.mockReturnValue({
      data: { total: 0, rows: [] },
      isLoading: false,
    })
  })

  it('renders all count and connection skeletons while Moysklad overview queries are loading', () => {
    mocks.useMoyskladHealth.mockReturnValue({ data: undefined, isLoading: true })
    mocks.useMoyskladMappings.mockReturnValue({ data: undefined, isLoading: true })

    const { container } = render(<MoyskladOverview />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
    expect(screen.queryByText(/^Статус:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Токен:/)).not.toBeInTheDocument()
  })
})
