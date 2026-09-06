/**
 * Style pins for TaxWarningBanner — p2-wave-6 (WCAG AA).
 *
 * Mount stack: background > muted/50 (dashboard main, layout.tsx:116).
 * Measured BEFORE: body text-status-warning on warn/10 = 4.07:1 light (FAIL);
 * CTA Link hardcoded text-white on solid warn = 4.81 light but 1.41 dark
 * (FAIL both-theme contract) with hover /90 dim 4.02 light; X hover warn/80
 * on the real stack = 2.95:1 <3 (1.4.11 FAIL — 80-sweep pinned 3.04 over a
 * bare-background base that the muted/50 main layer invalidates).
 * Remedies: body fg-on-tint (13.34/12.41); Link text-status-warning-foreground
 * (4.81/11.41) + hover:underline (no hover-dim); X hover full warn (4.07 ≥3).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaxWarningBanner } from '../TaxWarningBanner'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('TaxWarningBanner — wave-6 contrast pins', () => {
  it('body text uses fg-on-tint (text-foreground), not warn text', () => {
    render(<TaxWarningBanner taxConfigured={false} />)
    const body = screen.getByText(/налоговая система не настроена/i)
    expect(body).toHaveClass('text-foreground')
    expect(body.className).not.toContain('text-status-warning')
  })

  it('CTA Link uses the theme-aware warning-foreground token, never raw white', () => {
    render(<TaxWarningBanner taxConfigured={false} />)
    const link = screen.getByRole('link', { name: /настроить/i })
    expect(link).toHaveClass('text-status-warning-foreground')
    expect(link.className).not.toContain('text-white')
  })

  it('CTA Link drops the /90 hover dim and uses underline affordance (B10)', () => {
    render(<TaxWarningBanner taxConfigured={false} />)
    const link = screen.getByRole('link', { name: /настроить/i })
    expect(link.className).not.toContain('hover:bg-status-warning/90')
    expect(link).toHaveClass('hover:underline')
  })

  it('dismiss X keeps full warn on hover (no /80 darken; icon ≥3:1)', () => {
    render(<TaxWarningBanner taxConfigured={false} />)
    const btn = screen.getByRole('button', { name: /скрыть предупреждение/i })
    expect(btn).toHaveClass('text-status-warning', 'hover:text-status-warning')
    expect(btn.className).not.toContain('/80')
  })

  it('banner keeps the warning tint idiom: bg + border + icon channels', () => {
    render(<TaxWarningBanner taxConfigured={false} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-status-warning/10', 'border-status-warning/40')
    expect(alert.querySelector('svg')).toHaveClass('text-status-warning')
  })
})
