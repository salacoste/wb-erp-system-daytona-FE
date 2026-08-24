/**
 * SupplyDetailTrendSection — Defensive Frontend: velocity_trend 'no_data'/null must NOT
 * fabricate a 'stable' label + Minus icon + upward sparkline in the expanded detail panel
 * (iter-79 2nd-pass HIGH). The detail surface must mirror the row cell's honest "—"/"Нет данных".
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendingUp } from 'lucide-react'
import { SupplyDetailTrendSection, TrendIndicator } from '../SupplyDetailTrendSection'
import { VELOCITY_TREND_CONFIG } from '@/lib/supply-planning-utils'

describe('SupplyDetailTrendSection — unknown trend (no_data/null)', () => {
  it('renders "Нет данных" + "—" indicator and NO Minus icon / NO fabricated sparkline', () => {
    const { container } = render(<SupplyDetailTrendSection trend={null} TrendIcon={null} />)

    // honest label — NOT the fabricated "Стабильно"
    expect(screen.getByText('Нет данных')).toBeTruthy()
    expect(screen.queryByText('Стабильно')).toBeNull()
    // unknown indicator with accessible label (mirrors the row cell)
    expect(screen.getAllByLabelText('Нет данных о тренде продаж').length).toBeGreaterThanOrEqual(1)
    // neutral sparkline placeholder, not the upward ramp
    expect(screen.getByText('Недостаточно данных')).toBeTruthy()
    // zero trend SVG icons (the old code rendered a Minus svg here)
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('SupplyDetailTrendSection — known trend', () => {
  it('renders the trend icon + its label for a real trend (growing)', () => {
    const { container } = render(
      <SupplyDetailTrendSection trend="growing" TrendIcon={TrendingUp} />
    )
    expect(container.querySelector('.lucide-trending-up')).toBeTruthy()
    expect(screen.getByText(VELOCITY_TREND_CONFIG.growing.label)).toBeTruthy()
    expect(screen.queryByText('Нет данных')).toBeNull()
  })
})

describe('TrendIndicator', () => {
  it('null TrendIcon → "—" with aria-label, no svg', () => {
    const { container } = render(<TrendIndicator trend={null} TrendIcon={null} />)
    expect(screen.getByLabelText('Нет данных о тренде продаж')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('known TrendIcon → renders the icon svg', () => {
    const { container } = render(
      <TrendIndicator trend="growing" TrendIcon={TrendingUp} />
    )
    expect(container.querySelector('.lucide-trending-up')).toBeTruthy()
  })
})
