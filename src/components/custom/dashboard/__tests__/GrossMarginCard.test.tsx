/**
 * Tests for GrossMarginCard — Russian-locale rendering of the gross margin.
 *
 * Regression: the visible margin value + "vs <prev>" rendered dot-locale "25.0%" and the
 * п.п. delta rendered "+1.5 п.п." (dot). Now the % uses formatPercentage (comma + NBSP)
 * and the delta uses a comma decimal. Mirrors MarginCard.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GrossMarginCard } from '../GrossMarginCard'

function renderCard(props: Partial<React.ComponentProps<typeof GrossMarginCard>> = {}) {
  return render(
    <TooltipProvider>
      <GrossMarginCard
        grossMarginPct={25}
        previousGrossMarginPct={23.5}
        cogsCoverage={100}
        {...props}
      />
    </TooltipProvider>
  )
}

describe('GrossMarginCard — Russian locale', () => {
  it('renders the gross margin value in comma+NBSP locale, not dot-locale', () => {
    renderCard()
    expect(screen.getByText(/25,0\s+%/)).toBeInTheDocument()
    expect(screen.queryByText('25.0%')).not.toBeInTheDocument()
  })

  it('renders the "vs previous" comparison in Russian locale', () => {
    renderCard()
    expect(screen.getByText(/vs 23,5\s+%/)).toBeInTheDocument()
  })

  it('renders the п.п. delta with a comma decimal', () => {
    renderCard() // diff = 25 - 23.5 = +1.5
    expect(screen.getByText(/\+1,5 п\.п\./)).toBeInTheDocument()
    expect(screen.queryByText(/\+1\.5 п\.п\./)).not.toBeInTheDocument()
  })

  it('renders "—" when the gross margin is unavailable', () => {
    renderCard({ grossMarginPct: null })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('exposes the localized value in the aria-label too (RU screen-reader a11y)', () => {
    renderCard()
    expect(screen.getByRole('article', { name: /Валовая маржа: 25,0\s+%/ })).toBeInTheDocument()
  })
})

// iter-120: a positive-but-low gross margin must be visually distinct from a LOSS.
// Previously both 0–30% and <0% were red (positive markup painted identically to loss).
describe('GrossMarginCard — profit-vs-loss color bands (iter-120)', () => {
  it('colors a positive-but-low gross margin orange (низкая наценка), not the loss red', () => {
    renderCard({ grossMarginPct: 20, previousGrossMarginPct: null })
    expect(screen.getByText(/20,0\s+%/)).toHaveClass('text-orange-600')
    expect(screen.getByTestId('metric-card')).toHaveClass('border-orange-500')
    expect(screen.getByTestId('metric-card')).toHaveClass('from-orange-50')
  })

  it('colors a negative gross margin red (убыток) — never confused with a positive markup', () => {
    renderCard({ grossMarginPct: -10, previousGrossMarginPct: null })
    // hyphen-first = unambiguously literal; covers ASCII '-' and U+2212 '−'
    expect(screen.getByText(/[-−]10,0\s+%/)).toHaveClass('text-red-600')
    expect(screen.getByTestId('metric-card')).toHaveClass('border-red-500')
    expect(screen.getByTestId('metric-card')).toHaveClass('from-red-50')
  })

  it('colors exactly 0% orange — the boundary belongs to the profit (non-loss) side', () => {
    renderCard({ grossMarginPct: 0, previousGrossMarginPct: null })
    expect(screen.getByText(/0,0\s+%/)).toHaveClass('text-orange-600')
  })

  it('keeps the unchanged bands: ≥50 green, 30–50 yellow', () => {
    const { unmount } = renderCard({ grossMarginPct: 55, previousGrossMarginPct: null })
    expect(screen.getByText(/55,0\s+%/)).toHaveClass('text-green-600')
    unmount()
    renderCard({ grossMarginPct: 35, previousGrossMarginPct: null })
    expect(screen.getByText(/35,0\s+%/)).toHaveClass('text-yellow-600')
  })
})
