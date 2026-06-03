/**
 * Tests for MonitorBuyoutGauge
 * Epic 92-FE Story 92.5: Block 4 — Semi-circular SVG buyout rate gauge.
 *
 * Uses raw SVG (not recharts) — no jsdom mock needed.
 * Assertions verify aria-valuenow + data-testid, not just digit presence (92.4 H-2 lesson).
 * H-3 review fix: added out-of-range anomaly path tests (values 150, -5).
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { MonitorBuyoutGauge } from '../MonitorBuyoutGauge'

describe('MonitorBuyoutGauge', () => {
  it('renders numeric value "93%" and "Отличный" band label when buyoutRatePercent=93', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={93} />)

    // Center text shows rate with % symbol (Russian locale: comma + NBSP, 1 decimal)
    expect(screen.getByText(/93,0\s+%/)).toBeInTheDocument()
    // Band label for >= 90
    expect(screen.getByText('Отличный')).toBeInTheDocument()
    // Card title
    expect(screen.getByText('Выкуп за 30 дней')).toBeInTheDocument()
  })

  it('renders "—" and "Нет данных" band label when buyoutRatePercent=null', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={null} />)

    // Em-dash for null rate
    expect(screen.getByText('—')).toBeInTheDocument()
    // Null band label
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
    // No percentage shown
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
  })

  it('renders with role="meter", correct aria-valuenow, aria-labelledby, aria-valuetext, and data-testid', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={75} />)

    const gauge = screen.getByTestId('monitor-buyout-gauge')
    expect(gauge).toBeInTheDocument()
    expect(gauge).toHaveAttribute('role', 'meter')
    expect(gauge).toHaveAttribute('aria-valuenow', '75')
    expect(gauge).toHaveAttribute('aria-valuemin', '0')
    expect(gauge).toHaveAttribute('aria-valuemax', '100')
    // L-12 fix: aria-labelledby points to Card title; aria-valuetext carries numeric value
    expect(gauge).toHaveAttribute('aria-labelledby', 'buyout-gauge-title')
    expect(gauge).toHaveAttribute('aria-valuetext', '75%')
    // Band label for 70-89 range
    expect(screen.getByText('Требует внимания')).toBeInTheDocument()
  })

  it('renders "Низкий" band label for rate below 70', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={50} />)

    expect(screen.getByText(/50,0\s+%/)).toBeInTheDocument()
    expect(screen.getByText('Низкий')).toBeInTheDocument()
  })

  it('omits aria-valuenow when rate is null and aria-valuetext is "нет данных"', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={null} />)

    const gauge = screen.getByTestId('monitor-buyout-gauge')
    expect(gauge).not.toHaveAttribute('aria-valuenow')
    // L-12 fix: aria-valuetext carries the "нет данных" text; no aria-label needed
    expect(gauge).toHaveAttribute('aria-valuetext', 'нет данных')
    expect(gauge).toHaveAttribute('aria-labelledby', 'buyout-gauge-title')
  })

  // H-3 review fix: AC-9 out-of-range anomaly path
  it('shows AlertTriangle anomaly indicator and preserves raw value 150 in aria-valuenow', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={150} />)

    // Raw value displayed (not clamped) — Defensive Frontend Principle: raw values preserved
    expect(screen.getByText(/150,0\s+%/)).toBeInTheDocument()

    // Anomaly indicator visible
    expect(screen.getByText('Аномальное значение')).toBeInTheDocument()

    // aria-valuenow reflects raw value, not clamped to 100
    const gauge = screen.getByTestId('monitor-buyout-gauge')
    expect(gauge).toHaveAttribute('aria-valuenow', '150')
  })

  it('shows AlertTriangle anomaly indicator and preserves raw value -5 in aria-valuenow', () => {
    renderWithProviders(<MonitorBuyoutGauge buyoutRatePercent={-5} />)

    // Raw negative value displayed (locale minus may be hyphen or U+2212)
    expect(screen.getByText(/[-−]5,0\s+%/)).toBeInTheDocument()

    // Anomaly indicator visible
    expect(screen.getByText('Аномальное значение')).toBeInTheDocument()

    // aria-valuenow reflects raw value, not clamped to 0
    const gauge = screen.getByTestId('monitor-buyout-gauge')
    expect(gauge).toHaveAttribute('aria-valuenow', '-5')
  })
})
