import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortButton } from '../SortButton'

describe('SortButton', () => {
  it('renders children text', () => {
    render(
      <SortButton active={false} onClick={vi.fn()}>
        Колонка
      </SortButton>
    )
    expect(screen.getByText('Колонка')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <SortButton active={false} onClick={onClick}>
        Test
      </SortButton>
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('sets aria-pressed to false when inactive', () => {
    render(
      <SortButton active={false} onClick={vi.fn()}>
        Test
      </SortButton>
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets aria-pressed to true when active', () => {
    render(
      <SortButton active={true} onClick={vi.fn()}>
        Test
      </SortButton>
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('provides aria-label with sort direction when active and direction set', () => {
    render(
      <SortButton active={true} direction="desc" onClick={vi.fn()}>
        Column
      </SortButton>
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sort by Column, descending')
  })

  it('omits aria-label when not active', () => {
    render(
      <SortButton active={false} onClick={vi.fn()}>
        Test
      </SortButton>
    )
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label')
  })

  it('renders ArrowUpDown icon', () => {
    const { container } = render(
      <SortButton active={false} onClick={vi.fn()}>
        Test
      </SortButton>
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
