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
})
