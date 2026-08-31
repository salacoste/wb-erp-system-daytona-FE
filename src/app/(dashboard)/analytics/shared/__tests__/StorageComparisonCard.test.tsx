/**
 * StorageComparisonCard — storage source reconciliation (iter-126).
 * Pins the canonical 3% divergence tolerance (was a flat >1 ₽ that over-flagged large storage)
 * and the no-fabricated-0 behavior when the weekly report is missing.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorageComparisonCard } from '../StorageComparisonCard'

describe('StorageComparisonCard — divergence tolerance', () => {
  it('does NOT flag a within-tolerance 2% diff on large storage (the old >1 ₽ false-positive)', () => {
    render(
      <StorageComparisonCard
        data={{ storage: 102_000, storage_weekly_report: 100_000, storage_difference: 2_000 }}
      />
    )
    expect(screen.queryByText('Расхождение')).not.toBeInTheDocument()
  })

  it('flags a diff at/above the 3% tolerance', () => {
    const { container } = render(
      <StorageComparisonCard
        data={{ storage: 90_000, storage_weekly_report: 100_000, storage_difference: -10_000 }}
      />
    )
    expect(screen.getByText('Расхождение')).toBeInTheDocument()
    expect(screen.getByText('-10 000 ₽')).toHaveClass('text-foreground')
    expect(container.querySelector('.text-status-warning.font-bold')).not.toBeInTheDocument()
  })

  it('shows "—" (not a fabricated "0 ₽") and no warning when the weekly report is null', () => {
    render(
      <StorageComparisonCard
        data={{ storage: 5_000, storage_weekly_report: null, storage_difference: null }}
      />
    )
    expect(screen.queryByText('Расхождение')).not.toBeInTheDocument()
    // weekly + diff both render the em-dash placeholder, NOT "0 ₽"
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('0 ₽')).not.toBeInTheDocument()
  })
})
