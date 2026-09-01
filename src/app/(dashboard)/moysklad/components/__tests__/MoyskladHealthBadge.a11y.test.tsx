import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MoyskladHealthBadge } from '../MoyskladHealthBadge'

const mockUseMoyskladHealth = vi.fn()
const mockUseMoyskladOrganizations = vi.fn()

vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladHealth: () => mockUseMoyskladHealth(),
  useMoyskladOrganizations: (enabled: boolean) => mockUseMoyskladOrganizations(enabled),
}))

describe('MoyskladHealthBadge accessibility', () => {
  beforeEach(() => {
    mockUseMoyskladHealth.mockReturnValue({
      data: { tokenConfigured: true, readOnly: true },
      isLoading: false,
    })
    mockUseMoyskladOrganizations.mockReturnValue({ data: [] })
  })

  it('uses readable foreground text while status remains encoded by border and background', () => {
    render(<MoyskladHealthBadge />)

    const badge = screen.getByText('Подключён')
    expect(badge).toHaveClass('border-status-success/40', 'bg-status-success/10', 'text-foreground')
    expect(badge).not.toHaveClass('text-status-success')
  })

  it('renders the health badge skeleton while the Moysklad health query is loading', () => {
    mockUseMoyskladHealth.mockReturnValue({ data: undefined, isLoading: true })

    const { container } = render(<MoyskladHealthBadge />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(1)
    expect(screen.queryByText('Подключён')).not.toBeInTheDocument()
    expect(screen.queryByText('Не настроен')).not.toBeInTheDocument()
  })

  it('renders the disconnected health state with explicit text and non-color meaning', () => {
    mockUseMoyskladHealth.mockReturnValue({
      data: { tokenConfigured: false, readOnly: true },
      isLoading: false,
    })

    render(<MoyskladHealthBadge />)

    const badge = screen.getByText('Не настроен')
    expect(badge).toBeVisible()
    expect(badge).toHaveClass('border-destructive/30', 'text-destructive')
    expect(mockUseMoyskladOrganizations).toHaveBeenCalledWith(false)
  })
})
