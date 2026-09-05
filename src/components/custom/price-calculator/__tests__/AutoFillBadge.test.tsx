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
})
