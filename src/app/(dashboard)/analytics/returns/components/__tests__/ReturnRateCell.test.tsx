/**
 * ReturnRateCell (iter-127) — null returnRate (unknown, no sales data) must render "—" neutral,
 * NOT a fabricated "0.0%" coloured green/"healthy". Colour bands: >50 red, >=20 yellow, else green.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReturnRateCell } from '../ReturnsTableHelpers'

describe('ReturnRateCell', () => {
  it('renders "—" (muted) and no percentage for a null rate (unknown)', () => {
    render(<ReturnRateCell rate={null} />)
    const el = screen.getByText('—')
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('text-muted-foreground')
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('colours a genuine 0% green (not the same as unknown)', () => {
    render(<ReturnRateCell rate={0} />)
    const el = screen.getByText(/0,0\s%/) // \s matches the NBSP separator
    // Story 169.11: status tokens replace palette classes
    expect(el.className).toContain('text-status-success')
  })

  it('colours high rates yellow (>=20) and red (>50)', () => {
    const { rerender } = render(<ReturnRateCell rate={20} />)
    expect(screen.getByText(/20,0\s%/).className).toContain('text-status-warning')
    rerender(<ReturnRateCell rate={51} />)
    expect(screen.getByText(/51,0\s%/).className).toContain('text-status-error')
  })
})
