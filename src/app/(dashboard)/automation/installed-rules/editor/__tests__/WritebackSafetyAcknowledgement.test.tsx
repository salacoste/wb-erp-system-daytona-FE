/**
 * Style pins for WritebackSafetyAcknowledgement — p2-80-sweep (WCAG AA).
 *
 * The passive hint sits on background > status-warning/10 (section tint).
 * Measured: text-status-warning/80 = 3.04:1 light (FAIL 4.5 text);
 * text-foreground = 14.18:1 light / 15.89:1 dark (PASS). Canon wave-3:
 * full token also fails on this stack (4.24) → fg-on-tint remediation.
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

describe('WritebackSafetyAcknowledgement — /80-sweep contrast pins', () => {
  it('passive hint uses fg-on-tint (text-foreground), no /80 darkening', () => {
    renderAck(false)
    const hint = screen.getByTestId('writeback-safety-passive')
    expect(hint).toHaveClass('text-foreground')
    expect(hint.className).not.toContain('/80')
  })
})
