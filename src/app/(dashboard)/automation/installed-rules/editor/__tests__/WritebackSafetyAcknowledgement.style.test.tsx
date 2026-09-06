/**
 * Style pins for WritebackSafetyAcknowledgement — p2-wave-6 (WCAG AA).
 *
 * Body text on the warn/10 panel over the real mount stack (background >
 * muted/50 main, layout.tsx:116). Measured BEFORE: text-status-warning =
 * 4.07:1 light / 10.03 dark (FAIL 4.5 text); nested code chip /20-on-/10 =
 * 3.15:1 light. Remediation (wave-6 remedy-b, wave-3/4/5 canon): fg-on-tint —
 * text-foreground = 13.34:1 light / 12.41 dark (PASS); valence kept by the
 * tint + border + AlertTriangle icon (icon on warn/10 = 4.07/10.03 ≥3, 1.4.11).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WritebackSafetyAcknowledgement } from '../WritebackSafetyAcknowledgement'

function renderAck(activating = false) {
  return render(
    <WritebackSafetyAcknowledgement
      activating={activating}
      acknowledged={false}
      onAcknowledgementChange={vi.fn()}
    />
  )
}

describe('WritebackSafetyAcknowledgement — wave-6 contrast pins', () => {
  it('body text container uses fg-on-tint (text-foreground), not warn text', () => {
    renderAck(false)
    const heading = screen.getByText('Изменение цены (write-back)')
    const bodyContainer = heading.closest('div')
    expect(bodyContainer).toHaveClass('text-foreground')
    expect(bodyContainer?.className).not.toContain('text-status-warning')
  })

  it('inline code chip drops the compounding /20 layer (no nested tint)', () => {
    renderAck(false)
    const chip = screen.getByText('PRICE_WRITEBACK_ENABLED')
    expect(chip.className).not.toContain('/20')
  })

  it('panel keeps the warning tint idiom: bg + border on status-warning', () => {
    renderAck(false)
    const section = screen.getByTestId('writeback-safety')
    expect(section).toHaveClass('bg-status-warning/10', 'border-status-warning/40')
  })

  it('AlertTriangle icon keeps full warn (non-text ≥3:1 channel)', () => {
    renderAck(false)
    const section = screen.getByTestId('writeback-safety')
    const icon = section.querySelector('svg')
    expect(icon).toHaveClass('text-status-warning')
  })

  it('passive hint keeps text-foreground (80-sweep pin, retained)', () => {
    renderAck(false)
    const hint = screen.getByTestId('writeback-safety-passive')
    expect(hint).toHaveClass('text-foreground')
  })
})
