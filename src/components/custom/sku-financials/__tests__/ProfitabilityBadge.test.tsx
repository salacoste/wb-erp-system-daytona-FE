/**
 * Tests for ProfitabilityBadge — operating-margin badge.
 * Focus: Russian-locale margin rendering ("15,5 %" comma + NBSP, not "15.5%") and the
 * null-margin fallback to the status label (no fabricated "0 %").
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfitabilityBadge } from '../ProfitabilityBadge'

describe('ProfitabilityBadge', () => {
  it('renders the margin in Russian locale ("15,5 %", not "15.5%")', () => {
    render(<ProfitabilityBadge status="excellent" marginPct={15.5} />)
    expect(screen.getByText(/15,5\s%/)).toBeInTheDocument()
    expect(screen.queryByText(/15\.5%/)).not.toBeInTheDocument()
  })

  it('renders a negative margin with its sign in locale form ("-3,2 %")', () => {
    render(<ProfitabilityBadge status="loss" marginPct={-3.2} />)
    expect(screen.getByText(/-3,2\s%/)).toBeInTheDocument()
  })

  it('falls back to the status label (no fabricated "0 %") when marginPct is null', () => {
    render(<ProfitabilityBadge status="unknown" marginPct={null} />)
    // The badge shows the textual label, never "0 %" / "0,0 %".
    expect(screen.queryByText(/0,0\s%/)).not.toBeInTheDocument()
  })
})
