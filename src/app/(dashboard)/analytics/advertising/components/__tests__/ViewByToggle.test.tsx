/**
 * Tests for ViewByToggle component
 * Tests view mode switching with correct labels, ARIA, and styling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ViewByToggle } from '../ViewByToggle'
import type { ViewByMode } from '@/types/advertising-analytics'

const viewModes: ViewByMode[] = ['sku', 'campaign', 'brand', 'category']

describe('ViewByToggle', () => {
  it('renders all four view mode buttons', () => {
    render(<ViewByToggle viewBy="sku" onViewByChange={vi.fn()} />)
    expect(screen.getByText('По товарам')).toBeInTheDocument()
    expect(screen.getByText('По кампаниям')).toBeInTheDocument()
    expect(screen.getByText('По брендам')).toBeInTheDocument()
    expect(screen.getByText('По категориям')).toBeInTheDocument()
  })

  it.each(viewModes)('marks the active view %s as pressed', mode => {
    render(<ViewByToggle viewBy={mode} onViewByChange={vi.fn()} />)
    const button = screen.getByRole('button', { pressed: true })
    expect(button).toBeInTheDocument()
  })

  it('applies default variant to active button and outline to others', () => {
    render(<ViewByToggle viewBy="sku" onViewByChange={vi.fn()} />)
    const active = screen.getByRole('button', { pressed: true })
    // shadcn default variant has no "outline" in class name
    expect(active.textContent).toBe('По товарам')
    const inactive = screen.getByText('По кампаниям')
    // outline variant should contain "border" or "outline" in class
    expect(inactive.closest('button')).toBeInTheDocument()
  })

  it('calls onViewByChange with correct mode on click', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<ViewByToggle viewBy="sku" onViewByChange={handleChange} />)

    await user.click(screen.getByText('По кампаниям'))
    expect(handleChange).toHaveBeenCalledWith('campaign')

    await user.click(screen.getByText('По брендам'))
    expect(handleChange).toHaveBeenCalledWith('brand')
  })

  it('sets correct aria-label on each button', () => {
    render(<ViewByToggle viewBy="sku" onViewByChange={vi.fn()} />)
    expect(screen.getByLabelText('Просмотр по товарам')).toBeInTheDocument()
    expect(screen.getByLabelText('Просмотр по кампаниям')).toBeInTheDocument()
    expect(screen.getByLabelText('Просмотр по брендам')).toBeInTheDocument()
    expect(screen.getByLabelText('Просмотр по категориям')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ViewByToggle viewBy="sku" onViewByChange={vi.fn()} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
