/**
 * Tests for HealthScoreWidget — the system-health semi-circular gauge.
 * Focus: AC-9 arc-clamp hardening (ported from MonitorBuyoutGauge) — an out-of-range
 * healthScore must clamp the arc fill to [0,100] while still displaying the raw number,
 * with an out-of-range anomaly indicator. Mirrors MonitorBuyoutGauge's anomaly tests.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { HealthScoreWidget } from '../HealthScoreWidget'
import type { DashboardSystem } from '../../types/monitoring'

const ARC_LENGTH = Math.PI * 70 // matches HealthScoreWidget arc geometry (RADIUS=70)

function makeSystem(healthScore: number, activeAlerts = 0): DashboardSystem {
  return { overallStatus: 'healthy', healthScore, lastReportDate: null, activeAlerts }
}

/** Leading strokeDasharray value of the filled arc path (= fill length). */
function fillLength(container: HTMLElement): number {
  const filled = container.querySelectorAll('path[stroke-dasharray]')
  const dash = filled[filled.length - 1]?.getAttribute('stroke-dasharray') ?? ''
  return parseFloat(dash.split(' ')[0])
}

describe('HealthScoreWidget', () => {
  it('renders an in-range score with no anomaly indicator', () => {
    const { container } = renderWithProviders(
      <HealthScoreWidget system={makeSystem(85)} isLoading={false} />
    )
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '85')
    expect(screen.queryByText(/Аномальное значение/)).not.toBeInTheDocument()
    expect(fillLength(container)).toBeLessThanOrEqual(ARC_LENGTH + 0.01)
  })

  it('clamps the arc fill and flags an out-of-range score (>100) while showing the raw number', () => {
    const { container } = renderWithProviders(
      <HealthScoreWidget system={makeSystem(137)} isLoading={false} />
    )
    // Raw score still displayed (truthful) — not the clamped 100.
    expect(screen.getByText('137')).toBeInTheDocument()
    expect(screen.getByText(/Аномальное значение/)).toBeInTheDocument()
    // Arc fill clamped to the full semicircle, never the 137% → ~301 overflow.
    expect(fillLength(container)).toBeLessThanOrEqual(ARC_LENGTH + 0.01)
  })

  it('clamps a negative score to zero fill and flags the anomaly', () => {
    const { container } = renderWithProviders(
      <HealthScoreWidget system={makeSystem(-10)} isLoading={false} />
    )
    expect(screen.getByText('-10')).toBeInTheDocument()
    expect(screen.getByText(/Аномальное значение/)).toBeInTheDocument()
    expect(fillLength(container)).toBe(0)
  })

  it('shows a loading skeleton (no meter) when isLoading', () => {
    const { container } = renderWithProviders(<HealthScoreWidget system={undefined} isLoading />)
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
