/**
 * Tests for shared SortButton component
 * Story 71.8-FE: Search Analytics Tests & Polish
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortButton } from '../components/SortButton'

describe('SortButton', () => {
  it('renders children text', () => {
    render(
      <SortButton active={false} onClick={() => {}}>
        Заказы
      </SortButton>
    )
    expect(screen.getByText('Заказы')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <SortButton active={false} onClick={handleClick}>
        Заказы
      </SortButton>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('has type="button" attribute', () => {
    render(
      <SortButton active={false} onClick={() => {}}>
        Заказы
      </SortButton>
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('applies text-foreground class to icon when active', () => {
    const { container } = render(
      <SortButton active={true} onClick={() => {}}>
        Заказы
      </SortButton>
    )
    const icon = container.querySelector('svg')
    expect(icon?.getAttribute('class')).toContain('text-foreground')
    expect(icon?.getAttribute('class')).not.toContain('text-muted-foreground/50')
  })

  it('applies text-muted-foreground/50 class to icon when inactive', () => {
    const { container } = render(
      <SortButton active={false} onClick={() => {}}>
        Заказы
      </SortButton>
    )
    const icon = container.querySelector('svg')
    const cls = icon?.getAttribute('class') ?? ''
    expect(cls).toContain('text-muted-foreground/50')
    expect(cls.split(' ')).not.toContain('text-foreground')
  })
})
