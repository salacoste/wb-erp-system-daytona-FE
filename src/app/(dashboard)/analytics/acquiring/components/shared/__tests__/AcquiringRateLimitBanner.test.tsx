/**
 * AcquiringRateLimitBanner tests — Story 96.9-FE
 *
 * Smoke: renders amber banner with retry-seconds and refetch button.
 * A11y: role="status" (polite live region, not assertive alert).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AcquiringRateLimitBanner } from '../AcquiringRateLimitBanner'

describe('AcquiringRateLimitBanner', () => {
  it('renders with retry seconds and refetch button', () => {
    const onRefetch = vi.fn()
    render(<AcquiringRateLimitBanner retryAfterSeconds={30} onRefetch={onRefetch} />)

    const banner = screen.getByTestId('acquiring-rate-limit-banner')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('role', 'status')
    expect(banner).toHaveTextContent(/WB временно недоступна/)
    expect(banner).toHaveTextContent(/~30 сек/)
  })

  it('calls onRefetch when the button is clicked', () => {
    const onRefetch = vi.fn()
    render(<AcquiringRateLimitBanner retryAfterSeconds={60} onRefetch={onRefetch} />)

    const button = screen.getByText('Повторить')
    fireEvent.click(button)
    expect(onRefetch).toHaveBeenCalledTimes(1)
  })

  it('uses role="status" for polite A11y (not alert)', () => {
    render(<AcquiringRateLimitBanner retryAfterSeconds={10} onRefetch={vi.fn()} />)

    const banner = screen.getByTestId('acquiring-rate-limit-banner')
    expect(banner).toHaveAttribute('role', 'status')
  })

  it('renders amber styling classes', () => {
    render(<AcquiringRateLimitBanner retryAfterSeconds={30} onRefetch={vi.fn()} />)

    const banner = screen.getByTestId('acquiring-rate-limit-banner')
    expect(banner.className).toContain('amber')
  })
})
