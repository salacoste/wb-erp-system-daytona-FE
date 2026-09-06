/**
 * Style pins for AutoFillBadge — p2-80-sweep (WCAG AA).
 *
 * The "Восстановить" ghost button mounts on the price-calculator Card.
 * Measured hover (before): text-status-warning/80 over hover bg warn/10
 * = 3.04:1 light (FAIL 4.5 text). Remediation: drop the hover-darken +
 * warn/10 hover bg → ghost default accent pair (accent-fg on accent
 * = 14.77:1 light / 14.50:1 dark, PASS; base warn on card = 4.81/13.38 PASS).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutoFillBadge } from '../AutoFillBadge'

describe('AutoFillBadge — /80-sweep contrast pins', () => {
  it('restore button keeps full warn text and drops hover-darken classes', () => {
    render(<AutoFillBadge status="modified" onRestore={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Восстановить/ })
    expect(btn).toHaveClass('text-status-warning')
    expect(btn.className).not.toContain('/80')
    expect(btn.className).not.toContain('hover:bg-status-warning')
  })

  it('restore button hover switches to foreground (fg-on-accent 14.77/14.50)', () => {
    // wave-6: rest warn-on-card = 4.81/13.38 PASS; the ghost hover:bg-accent
    // layer under warn text measured 4.41 light (FAIL) — hover:text-foreground
    // is the attested accent pair.
    render(<AutoFillBadge status="modified" onRestore={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Восстановить/ })
    expect(btn).toHaveClass('hover:text-foreground')
  })
})

describe('AutoFillBadge — wave-6 fg-on-tint badge pins', () => {
  it('modified badge: text-foreground over the kept warn/10 tint + border', () => {
    render(<AutoFillBadge status="modified" onRestore={vi.fn()} />)
    const badge = screen.getByText('Изменено')
    expect(badge).toHaveClass('bg-status-warning/10', 'border-status-warning/30', 'text-foreground')
    expect(badge.className).not.toContain('text-status-warning')
  })

  it('auto badge (status API): text-foreground over the kept success/10 tint', () => {
    render(<AutoFillBadge status="auto" />)
    const badge = screen.getByText('Автозаполнено')
    expect(badge).toHaveClass('bg-status-success/10', 'border-status-success/30', 'text-foreground')
    expect(badge.className).not.toContain('text-status-success')
  })

  it('legacy source API badges use the same fg-on-tint idiom', () => {
    render(<AutoFillBadge source="manual" />)
    expect(screen.getByText('Вручную')).toHaveClass('text-foreground')
    render(<AutoFillBadge source="auto" />)
    expect(screen.getByText('Авто')).toHaveClass('text-foreground')
  })
})
