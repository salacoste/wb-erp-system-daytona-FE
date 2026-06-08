/**
 * Tests for AdvertisingWidgetStates — skeleton and error states
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WidgetSkeleton, WidgetError } from '../AdvertisingWidgetStates'

describe('WidgetSkeleton', () => {
  it('renders with correct testid', () => {
    render(<WidgetSkeleton />)

    expect(screen.getByTestId('advertising-skeleton')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<WidgetSkeleton className="custom-class" />)

    const el = screen.getByTestId('advertising-skeleton')
    expect(el.classList.contains('custom-class')).toBe(true)
  })

  it('renders skeleton placeholders for metrics', () => {
    const { container } = render(<WidgetSkeleton />)

    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('WidgetError', () => {
  it('renders error message with testid', () => {
    const onRetry = vi.fn()
    render(<WidgetError onRetry={onRetry} />)

    expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    const onRetry = vi.fn()
    render(<WidgetError onRetry={onRetry} />)

    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<WidgetError onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    const onRetry = vi.fn()
    render(<WidgetError className="extra-class" onRetry={onRetry} />)

    const el = screen.getByTestId('advertising-widget')
    expect(el.classList.contains('extra-class')).toBe(true)
  })

  it('renders the advertising icon and heading', () => {
    const onRetry = vi.fn()
    render(<WidgetError onRetry={onRetry} />)

    expect(screen.getByText('Реклама')).toBeInTheDocument()
  })
})
