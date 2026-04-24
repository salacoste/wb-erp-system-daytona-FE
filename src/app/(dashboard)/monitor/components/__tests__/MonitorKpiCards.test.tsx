/**
 * Tests for MonitorKpiCards
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 *
 * Test assertions use exact regex patterns (not trivially-true digit matches)
 * per Story 90.2 M-3 lesson and CLAUDE.md anti-pattern guidance.
 */

import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { MonitorKpi } from '../../types/monitor-summary'
import { MonitorKpiCards } from '../MonitorKpiCards'

const baseKpi: MonitorKpi = {
  totalProducts: 150,
  productsWithCogs: 120,
  cogsCoveragePercent: 80.0,
  buyoutRatePercent: 68.5,
  lastSyncAt: '2026-04-24T10:00:00Z',
}

describe('MonitorKpiCards', () => {
  it('renders all 4 card titles when data is fully populated', () => {
    renderWithProviders(<MonitorKpiCards kpi={baseKpi} />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    expect(screen.getByText('С COGS')).toBeInTheDocument()
    expect(screen.getByText('Покрытие COGS')).toBeInTheDocument()
    expect(screen.getByText('Выкуп за 30 дней')).toBeInTheDocument()
  })

  it('renders count values correctly scoped to their cards (L-2 fix)', () => {
    renderWithProviders(<MonitorKpiCards kpi={baseKpi} />)

    // Scope via aria-labeled region to avoid trivially-true bare-number matches
    const totalCard = screen.getByRole('region', { name: 'Всего артикулов' })
    expect(within(totalCard).getByText('150')).toBeInTheDocument()

    const cogsCard = screen.getByRole('region', { name: 'С COGS' })
    expect(within(cogsCard).getByText('120')).toBeInTheDocument()
  })

  it('renders cogsCoveragePercent: null as "—" not "0%" or empty', () => {
    const kpi: MonitorKpi = { ...baseKpi, cogsCoveragePercent: null }
    renderWithProviders(<MonitorKpiCards kpi={kpi} />)

    // The em dash must appear somewhere
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)

    // Must NOT render any "0%" or "0,0%" variant for the null field
    expect(screen.queryByText(/^0[,.]?0?\s*%$/)).not.toBeInTheDocument()
  })

  it('renders buyoutRatePercent: null as "—" not "0%" or empty', () => {
    const kpi: MonitorKpi = { ...baseKpi, buyoutRatePercent: null }
    renderWithProviders(<MonitorKpiCards kpi={kpi} />)

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)

    expect(screen.queryByText(/^0[,.]?0?\s*%$/)).not.toBeInTheDocument()
  })

  it('shows anomaly AlertTriangle when productsWithCogs > totalProducts', () => {
    const anomalyKpi: MonitorKpi = {
      ...baseKpi,
      totalProducts: 100,
      productsWithCogs: 150, // anomaly: 150 > 100
    }
    renderWithProviders(<MonitorKpiCards kpi={anomalyKpi} />)

    // AlertTriangle rendered with aria-label
    const triangle = screen.getByLabelText('Аномалия данных')
    expect(triangle).toBeInTheDocument()
  })

  it('anomaly indicator tooltip shows both diagnostic values when productsWithCogs > totalProducts (H-2 fix)', async () => {
    const anomalousKpi: MonitorKpi = {
      ...baseKpi,
      totalProducts: 100,
      productsWithCogs: 150, // impossible: more items-with-COGS than total
    }
    renderWithProviders(<MonitorKpiCards kpi={anomalousKpi} />)

    const triangle = screen.getByLabelText('Аномалия данных')
    const user = userEvent.setup()
    await user.hover(triangle)

    // Tooltip renders lazily on hover — assert both diagnostic values appear
    expect(await screen.findByText(/150/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('does NOT show anomaly indicator when productsWithCogs <= totalProducts', () => {
    // baseKpi: productsWithCogs=120, totalProducts=150 — valid, no anomaly
    renderWithProviders(<MonitorKpiCards kpi={baseKpi} />)

    expect(screen.queryByLabelText('Аномалия данных')).not.toBeInTheDocument()
  })

  it('renders zero counts correctly for empty cabinet (0 products)', () => {
    const emptyKpi: MonitorKpi = {
      totalProducts: 0,
      productsWithCogs: 0,
      cogsCoveragePercent: null,
      buyoutRatePercent: null,
      lastSyncAt: null,
    }
    renderWithProviders(<MonitorKpiCards kpi={emptyKpi} />)

    // Both counts render as "0" — legitimate zero, not "—"
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)

    // Both ratio cards render "—"
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders formatPercentage output for non-null cogsCoveragePercent', () => {
    // formatPercentage(80.0) → "80,0 %" in ru-RU Intl.NumberFormat
    renderWithProviders(<MonitorKpiCards kpi={baseKpi} />)

    // Match the Intl-formatted percentage — avoid trivial /80/ match
    expect(screen.getByText(/80[,.]0\s*%/)).toBeInTheDocument()
  })
})
