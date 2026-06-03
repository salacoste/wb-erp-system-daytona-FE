/**
 * Tests for MarginCard — Russian-locale rendering of the operational margin.
 *
 * Regression: the visible margin value + the "vs <prev>" comparison rendered dot-locale
 * `${marginPct.toFixed(1)}%` ("25.0%"), and the п.п. delta rendered "+1.5 п.п." (dot). Now
 * the % uses formatPercentage (comma + NBSP) and the delta uses a comma decimal.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MarginCard } from '../MarginCard'

function renderCard(props: Partial<React.ComponentProps<typeof MarginCard>> = {}) {
  return render(
    <TooltipProvider>
      <MarginCard marginPct={25} previousMarginPct={23.5} cogsCoverage={100} {...props} />
    </TooltipProvider>
  )
}

describe('MarginCard — Russian locale', () => {
  it('renders the margin value in comma+NBSP locale, not dot-locale', () => {
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

  it('renders "—" when the margin is unavailable', () => {
    renderCard({ marginPct: null })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('exposes the localized value in the aria-label too (RU screen-reader a11y)', () => {
    renderCard()
    expect(
      screen.getByRole('article', { name: /Операционная маржа: 25,0\s+%/ })
    ).toBeInTheDocument()
  })
})

// iter-120: a thin-but-POSITIVE operating margin must be visually distinct from a LOSS.
// Previously both 0–15% and <0% were red (profit painted identically to loss).
describe('MarginCard — profit-vs-loss color bands (iter-120)', () => {
  it('colors a thin-but-positive margin orange (низкая), not the loss red', () => {
    render(
      <TooltipProvider>
        <MarginCard marginPct={10} previousMarginPct={null} cogsCoverage={100} />
      </TooltipProvider>
    )
    expect(screen.getByText(/10,0\s+%/)).toHaveClass('text-orange-600')
    const card = screen.getByTestId('metric-card')
    expect(card).toHaveClass('border-orange-500')
    expect(card).toHaveClass('from-orange-50')
  })

  it('colors a negative margin red (убыток) — never confused with a thin profit', () => {
    render(
      <TooltipProvider>
        <MarginCard marginPct={-10} previousMarginPct={null} cogsCoverage={100} />
      </TooltipProvider>
    )
    // hyphen-first in the class = unambiguously literal; covers both ASCII '-' and U+2212 '−'
    expect(screen.getByText(/[-−]10,0\s+%/)).toHaveClass('text-red-600')
    const card = screen.getByTestId('metric-card')
    expect(card).toHaveClass('border-red-500')
    expect(card).toHaveClass('from-red-50')
  })

  it('colors exactly 0% orange — the boundary belongs to the profit (non-loss) side', () => {
    render(
      <TooltipProvider>
        <MarginCard marginPct={0} previousMarginPct={null} cogsCoverage={100} />
      </TooltipProvider>
    )
    expect(screen.getByText(/0,0\s+%/)).toHaveClass('text-orange-600')
    expect(screen.getByTestId('metric-card')).toHaveClass('border-orange-500')
  })

  it('keeps the unchanged bands: ≥30 green, 15–30 yellow', () => {
    const { unmount } = render(
      <TooltipProvider>
        <MarginCard marginPct={35} previousMarginPct={null} cogsCoverage={100} />
      </TooltipProvider>
    )
    expect(screen.getByText(/35,0\s+%/)).toHaveClass('text-green-600')
    unmount()
    render(
      <TooltipProvider>
        <MarginCard marginPct={20} previousMarginPct={null} cogsCoverage={100} />
      </TooltipProvider>
    )
    expect(screen.getByText(/20,0\s+%/)).toHaveClass('text-yellow-600')
  })
})
