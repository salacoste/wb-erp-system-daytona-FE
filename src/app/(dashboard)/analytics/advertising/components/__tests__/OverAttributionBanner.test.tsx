import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OverAttributionBanner } from '../OverAttributionBanner'

describe('OverAttributionBanner', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(
      <OverAttributionBanner count={0} filterActive={false} onFilterChange={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders banner with correct count text (1 товар)', () => {
    render(<OverAttributionBanner count={1} filterActive={false} onFilterChange={vi.fn()} />)
    expect(screen.getByText(/1 товар с over-attribution/)).toBeInTheDocument()
  })

  it('renders banner with correct count text (3 товара)', () => {
    render(<OverAttributionBanner count={3} filterActive={false} onFilterChange={vi.fn()} />)
    expect(screen.getByText(/3 товара с over-attribution/)).toBeInTheDocument()
  })

  it('renders banner with correct count text (5 товаров)', () => {
    render(<OverAttributionBanner count={5} filterActive={false} onFilterChange={vi.fn()} />)
    expect(screen.getByText(/5 товаров с over-attribution/)).toBeInTheDocument()
  })

  it('calls onFilterChange when switch is toggled', () => {
    const handler = vi.fn()
    render(<OverAttributionBanner count={2} filterActive={false} onFilterChange={handler} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('shows "Скрыть" label for the switch', () => {
    render(<OverAttributionBanner count={1} filterActive={false} onFilterChange={vi.fn()} />)
    expect(screen.getByText('Скрыть')).toBeInTheDocument()
  })

  it('renders switch in checked state when filterActive is true', () => {
    render(<OverAttributionBanner count={2} filterActive={true} onFilterChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toBeChecked()
  })
})
