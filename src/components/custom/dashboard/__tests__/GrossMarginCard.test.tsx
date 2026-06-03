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
