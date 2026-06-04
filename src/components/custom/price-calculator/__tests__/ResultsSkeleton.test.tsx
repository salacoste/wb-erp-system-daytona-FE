/**
 * Russian-locale guard for ResultsSkeleton's calc-progress percent (iter-111).
 *
 * The cosmetic calc skeleton renders `{Math.round(progress)}%` → formatPercentageInt(progress) →
 * "0 %" / "7 %" (whole percent + NBSP). progress is internal fractional animation state (the
 * interval bumps it by 100/(duration/100), e.g. +6.667). Whole-percent display is preserved (≡ the
 * old Math.round; formatPercentageInt rounds half-up for v≥0). It's a transient sub-second skeleton,
 * so unlike a monitored long-running bar there's no "live-indicator" 1-decimal concern. `\s` = NBSP.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ResultsSkeleton } from '../ResultsSkeleton'

afterEach(() => {
  vi.useRealTimers()
})

describe('ResultsSkeleton — calc progress locale', () => {
  it('renders initial progress as "0 %" (comma-locale NBSP, not "0%")', () => {
    vi.useFakeTimers()
    render(<ResultsSkeleton estimatedDuration={1500} />)
    expect(screen.getByText(/^0\s%$/)).toBeInTheDocument()
  })

  it('rounds fractional animation progress to whole percent ("7 %" after one 100ms tick)', () => {
    vi.useFakeTimers()
    render(<ResultsSkeleton estimatedDuration={1500} />)
    // one tick: progress += 100/(1500/100) = 6.667 → Math.round/Intl → "7 %"
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByText(/^7\s%$/)).toBeInTheDocument()
  })
})
