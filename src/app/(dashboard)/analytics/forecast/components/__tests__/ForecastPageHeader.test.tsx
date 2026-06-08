/**
 * ForecastPageHeader tests — Story 108.2-FE.
 *
 * Smoke: renders Brain icon, title, subtitle. Children slot renders when provided.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ForecastPageHeader } from '../ForecastPageHeader'

describe('ForecastPageHeader', () => {
  it('renders the page title "AI Прогноз продаж"', () => {
    renderWithProviders(<ForecastPageHeader />)
    expect(screen.getByText('AI Прогноз продаж')).toBeInTheDocument()
  })

  it('renders the MindsDB subtitle', () => {
    renderWithProviders(<ForecastPageHeader />)
    expect(screen.getByText(/Прогноз на основе машинного обучения/)).toBeInTheDocument()
  })

  it('renders a Brain icon (SVG)', () => {
    const { container } = renderWithProviders(<ForecastPageHeader />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    renderWithProviders(
      <ForecastPageHeader>
        <span data-testid="child-slot">Child content</span>
      </ForecastPageHeader>
    )
    expect(screen.getByTestId('child-slot')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('does not render children wrapper when children is omitted', () => {
    const { container } = renderWithProviders(<ForecastPageHeader />)
    // The children wrapper div has "flex items-center gap-4" — should not exist
    const wrapper = container.querySelector('.flex.items-center.gap-4')
    expect(wrapper).toBeNull()
  })
})
