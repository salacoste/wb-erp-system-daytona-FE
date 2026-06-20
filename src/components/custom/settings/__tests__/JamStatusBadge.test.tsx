import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import { JamStatusBadge } from '../JamStatusBadge'

const mockUseJamStatus = vi.fn()

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: (...args: unknown[]) => mockUseJamStatus(...args),
}))

describe('JamStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an explicit unavailable state when Jam data is absent', () => {
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<JamStatusBadge cabinetId="cabinet-1" />)

    expect(screen.getByText(/Статус Джем сейчас недоступен/)).toBeInTheDocument()
  })
})
