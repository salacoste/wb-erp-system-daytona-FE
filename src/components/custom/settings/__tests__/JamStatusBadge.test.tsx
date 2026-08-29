import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import { JamStatusBadge } from '../JamStatusBadge'

const mockUseJamStatus = vi.fn()
const mockUseDelayedLoadingState = vi.fn()

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: (...args: unknown[]) => mockUseJamStatus(...args),
}))

vi.mock('@/hooks/useDelayedLoadingState', () => ({
  useDelayedLoadingState: (...args: unknown[]) => mockUseDelayedLoadingState(...args),
}))

describe('JamStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDelayedLoadingState.mockReturnValue(false)
  })

  it('renders an explicit unavailable state when Jam data is absent', () => {
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: false })

    renderWithProviders(<JamStatusBadge cabinetId="cabinet-1" />)

    expect(screen.getByText(/Статус Джем сейчас недоступен/)).toBeInTheDocument()
  })

  it('keeps immediate and delayed loading states distinct', () => {
    mockUseJamStatus.mockReturnValue({ data: undefined, isLoading: true })

    const { container, rerender } = renderWithProviders(
      <JamStatusBadge cabinetId="cabinet-loading" />
    )
    expect(container.querySelectorAll('[class*="animate-pulse"]')).toHaveLength(2)

    mockUseDelayedLoadingState.mockReturnValue(true)
    rerender(<JamStatusBadge cabinetId="cabinet-loading" />)
    expect(screen.getByText(/загружается дольше обычного/)).toBeVisible()
  })

  it('offers a safe external upgrade action only for an available lower tier', () => {
    mockUseJamStatus.mockReturnValue({
      data: {
        tier: 'standard',
        available: true,
        searchTextsLimit: 10,
        checkedAt: '2026-08-29T12:00:00Z',
        probeCallsMade: 1,
      },
      isLoading: false,
    })

    renderWithProviders(<JamStatusBadge cabinetId="cabinet-standard" />)

    expect(screen.getByText('Джем Стандарт')).toBeVisible()
    expect(screen.getByRole('link', { name: /Повысить/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /Повысить/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )
  })

  it.each([
    ['advanced', true],
    ['unknown', true],
    ['standard', false],
  ])('does not offer upgrade for %s when availability is %s', (tier, available) => {
    mockUseJamStatus.mockReturnValue({
      data: {
        tier,
        available,
        searchTextsLimit: 0,
        checkedAt: '2026-08-29T12:00:00Z',
        probeCallsMade: 1,
      },
      isLoading: false,
    })

    renderWithProviders(<JamStatusBadge cabinetId="cabinet-restricted" />)

    expect(screen.queryByRole('link', { name: /Повысить/ })).not.toBeInTheDocument()
  })
})
