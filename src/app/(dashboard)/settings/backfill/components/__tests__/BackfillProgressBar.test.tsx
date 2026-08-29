/**
 * Russian-locale guard for BackfillProgressBar's visible percentage (iter-109).
 *
 * The visible (aria-hidden) text renders `{progress}%` → formatPercentage(progress, 1) → "75,0 %"
 * (comma + NBSP). progress is a backend percentage that can be fractional (completed/total). We use
 * 1 decimal (NOT Int) so a LIVE in-progress value stays honest: Int would round 99.7→"100 %" while
 * the bar isn't full and status is still in_progress (false-complete). The aria-label keeps
 * dot-locale (screen-reader exception, §4). CSS width, accessible values, and visible text all use
 * one clamped percentage. This component had no test; `\s` matches the ru-RU NBSP.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackfillProgressBar } from '../BackfillProgressBar'

describe('BackfillProgressBar — visible percent locale', () => {
  it('renders integer progress as "75,0 %" (comma + NBSP, not "75%")', () => {
    render(<BackfillProgressBar progress={75} status="in_progress" />)
    expect(screen.getByText(/^75,0\s%$/)).toHaveClass('tabular-nums')
    expect(screen.getByRole('progressbar')).toHaveClass('motion-reduce:transition-none')
  })

  it('renders fractional progress at 1 decimal ("42,9 %")', () => {
    render(<BackfillProgressBar progress={42.86} status="in_progress" />)
    expect(screen.getByText(/^42,9\s%$/)).toBeInTheDocument()
  })

  it('keeps near-100 in-progress HONEST: 99.7 → "99,7 %" (not rounded to "100 %")', () => {
    render(<BackfillProgressBar progress={99.7} status="in_progress" />)
    expect(screen.getByText(/^99,7\s%$/)).toBeInTheDocument()
    // aria-valuenow carries the raw value for assistive tech
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '99.7')
  })

  it('hides the visible percent when showText is false (aria-label still present)', () => {
    render(<BackfillProgressBar progress={50} status="completed" showText={false} />)
    expect(screen.queryByText(/^50,0\s%$/)).not.toBeInTheDocument()
    // aria-label keeps dot-locale (§4 screen-reader exception)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Прогресс: 50%')
  })

  it.each([
    [-12, 0],
    [140, 100],
  ])('clamps out-of-range progress %s to the honest accessible value %s', (progress, clamped) => {
    render(<BackfillProgressBar progress={progress} status="in_progress" />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', String(clamped))
    expect(progressbar).toHaveAttribute('aria-label', `Прогресс: ${clamped}%`)
    expect(progressbar).toHaveStyle({ width: `${clamped}%` })
    expect(screen.getByText(new RegExp(`^${clamped},0\\s%$`))).toBeInTheDocument()
  })
})
