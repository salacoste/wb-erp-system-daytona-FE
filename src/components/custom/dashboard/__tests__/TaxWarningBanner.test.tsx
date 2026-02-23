/**
 * TDD RED PHASE: TaxWarningBanner Tests
 * Story 66.7-FE: Tax Warning & Empty States
 * Epic 66-FE: Tax & VAT Accounting Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaxWarningBanner } from '../TaxWarningBanner'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  sessionStorage.clear()
})

describe('TaxWarningBanner (Story 66.7-FE)', () => {
  it('1: renders warning when taxConfigured is false', () => {
    render(<TaxWarningBanner taxConfigured={false} />)

    expect(screen.getByText(/налоговая система не настроена/i)).toBeInTheDocument()
  })

  it('2: does not render when taxConfigured is true', () => {
    render(<TaxWarningBanner taxConfigured={true} />)

    expect(screen.queryByText(/налоговая система не настроена/i)).not.toBeInTheDocument()
  })

  it('3: has CTA link to /settings/tax', () => {
    render(<TaxWarningBanner taxConfigured={false} />)

    const link = screen.getByRole('link', { name: /настроить/i })
    expect(link).toHaveAttribute('href', '/settings/tax')
  })

  it('4: dismiss button hides the banner', () => {
    render(<TaxWarningBanner taxConfigured={false} />)

    expect(screen.getByText(/налоговая система не настроена/i)).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /скрыть предупреждение/i })
    fireEvent.click(dismissBtn)

    expect(screen.queryByText(/налоговая система не настроена/i)).not.toBeInTheDocument()
  })

  it('5: dismissal persisted in sessionStorage', () => {
    render(<TaxWarningBanner taxConfigured={false} />)

    const dismissBtn = screen.getByRole('button', { name: /скрыть предупреждение/i })
    fireEvent.click(dismissBtn)

    expect(sessionStorage.getItem('tax-warning-dismissed')).toBe('true')
  })

  it('6: stays hidden when sessionStorage has dismissal', () => {
    sessionStorage.setItem('tax-warning-dismissed', 'true')

    render(<TaxWarningBanner taxConfigured={false} />)

    expect(screen.queryByText(/налоговая система не настроена/i)).not.toBeInTheDocument()
  })

  it('7: uses role="alert" for accessibility', () => {
    render(<TaxWarningBanner taxConfigured={false} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('8: reappears when sessionStorage cleared (new session)', () => {
    sessionStorage.setItem('tax-warning-dismissed', 'true')
    sessionStorage.clear()

    render(<TaxWarningBanner taxConfigured={false} />)

    expect(screen.getByText(/налоговая система не настроена/i)).toBeInTheDocument()
  })
})
