/**
 * Style pins for AutoFillWarning — p2-80-sweep (WCAG AA).
 *
 * The dismiss X (ICON, WCAG 1.4.11 ≥3:1) sits inside the Alert's
 * status-warning/10 tint. Measured hover (before): warn/80 over the stacked
 * warn/10 > warn/10 = 2.78:1 (FAIL). Remediation: pin hover to the FULL
 * token (icon on warn/10 > warn/10 = 3.76:1 PASS) while keeping the
 * warn-tinted hover bg affordance.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutoFillWarning } from '../AutoFillWarning'

describe('AutoFillWarning — /80-sweep contrast pins', () => {
  it('dismiss button pins hover to full warn (no /80), keeps warn/10 hover bg', () => {
    render(<AutoFillWarning type="dimensions" />)
    const btn = screen.getByRole('button', { name: /Закрыть предупреждение/ })
    expect(btn).toHaveClass('text-status-warning')
    expect(btn.className).not.toContain('/80')
    expect(btn).toHaveClass('hover:bg-status-warning/10')
  })
})
