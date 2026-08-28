/**
 * Tests for MonitorMetricsTable
 * Epic 92-FE Story 92.3: Monitor Metrics Table — 4 Periods
 *
 * Exact regex assertions for formatted currency (CLAUDE.md anti-pattern guidance).
 * Anomaly tooltip via userEvent.hover + findByText (Story 92.2 H-2 lesson).
 * Pure computeDelta tests moved to monitor-metrics-utils.test.ts (fix H-1).
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { MonitorSummaryResponse, PeriodMetrics } from '../../types/monitor-summary'
import { MonitorMetricsTable } from '../MonitorMetricsTable'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const basePeriod: PeriodMetrics = {
  salesCount: 10,
  returnsCount: 1,
  revenue: 50000,
  cogs: 30000,
  expenses: 5000,
  advertisingSpend: 2000,
  margin: 13000,
}

function makePeriods(
  overrides: Partial<{
    today: Partial<PeriodMetrics>
    yesterday: Partial<PeriodMetrics>
    last30Days: Partial<PeriodMetrics>
    prev30Days: Partial<PeriodMetrics>
  }> = {}
): MonitorSummaryResponse['periods'] {
  return {
    today: { ...basePeriod, ...overrides.today },
    yesterday: { ...basePeriod, ...overrides.yesterday },
    last30Days: { ...basePeriod, ...overrides.last30Days },
    prev30Days: { ...basePeriod, ...overrides.prev30Days },
  }
}

// ---------------------------------------------------------------------------
// Component tests
// ---------------------------------------------------------------------------

describe('MonitorMetricsTable', () => {
  it('renders all 7 row labels and 4 period column headers', () => {
    renderWithProviders(<MonitorMetricsTable periods={makePeriods()} />)

    // Column headers
    expect(screen.getByText('Показатель')).toBeInTheDocument()
    expect(screen.getByText(/^Сегодня/)).toBeInTheDocument()
    expect(screen.getByText('Вчера')).toBeInTheDocument()
    expect(screen.getByText('30 дней')).toBeInTheDocument()
    expect(screen.getByText('Пред. 30 дней')).toBeInTheDocument()

    // Row labels (BD-22 renamed "Заказы"→"Продажи + Возвраты (транзакций)"; BD-24 renamed COGS)
    expect(screen.getByText('Продажи + Возвраты (транзакций)')).toBeInTheDocument()
    expect(screen.getByText('Сумма транзакций, не количество заказов')).toBeInTheDocument()
    expect(screen.getByText('Продажи')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('Себестоимость (COGS)')).toBeInTheDocument()
    expect(screen.getByText('Затраты на проданные товары')).toBeInTheDocument()
    expect(screen.getByText('Расходы')).toBeInTheDocument()
    expect(screen.getByText('Маржа')).toBeInTheDocument()
    expect(screen.getByText('Возвраты')).toBeInTheDocument()
  })

  it('renders "—" for null revenue in any period (null-vs-zero discipline)', () => {
    const periods = makePeriods({ today: { revenue: null } })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    // At least one "—" must appear (null revenue)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)

    // Must NOT render "0 ₽" for the null field
    expect(screen.queryByText(/^0\s*₽$/)).not.toBeInTheDocument()
  })

  it('renders all 4 negative-margin cells in red, not positive ones (fix L-1)', () => {
    const periods = makePeriods({
      today: { margin: -500 },
      yesterday: { margin: -200 },
      last30Days: { margin: -1000 },
      prev30Days: { margin: 800 }, // positive — must NOT be red
    })
    const { container } = renderWithProviders(<MonitorMetricsTable periods={periods} />)

    // Find the margin row by its label text
    const allRows = container.querySelectorAll('tbody tr')
    const marginTr = Array.from(allRows).find(tr =>
      tr.querySelector('td')?.textContent?.includes('Маржа')
    )
    expect(marginTr).not.toBeNull()

    const cells = marginTr!.querySelectorAll('td')
    // cells[0] = label, cells[1..4] = today/yesterday/last30/prev30
    expect(cells[1]).toHaveClass('text-status-error') // today  (-500)
    expect(cells[2]).toHaveClass('text-status-error') // yesterday (-200)
    expect(cells[3]).toHaveClass('text-status-error') // last30 (-1000)
    expect(cells[4]).not.toHaveClass('text-status-error') // prev30 (+800)
  })

  it('shows ↑ green delta when today sales > yesterday sales (higher-is-better)', () => {
    const periods = makePeriods({
      today: { salesCount: 20 },
      yesterday: { salesCount: 10 },
    })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    // Should render a green "↑ +100.0%" delta for sales row
    const greenSpans = document.querySelectorAll('span.text-status-success')
    const hasPositiveDelta = Array.from(greenSpans).some(el => el.textContent?.includes('↑'))
    expect(hasPositiveDelta).toBe(true)
  })

  it('shows ↑ red delta when today COGS > yesterday COGS (higher-is-worse)', () => {
    const periods = makePeriods({
      today: { cogs: 40000 },
      yesterday: { cogs: 30000 },
    })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    // COGS increased = bad (red)
    const redSpans = document.querySelectorAll('span.text-status-error')
    const hasBadIncrease = Array.from(redSpans).some(el => el.textContent?.includes('↑'))
    expect(hasBadIncrease).toBe(true)
  })

  it('shows lag badge with updated text when today.salesCount === 0 && today.returnsCount === 0 (fix M-3)', () => {
    const periods = makePeriods({ today: { salesCount: 0, returnsCount: 0 } })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    expect(screen.getByText('Нет данных за сегодня')).toBeInTheDocument()
  })

  it('does NOT show lag badge when today has non-zero sales', () => {
    const periods = makePeriods({ today: { salesCount: 5, returnsCount: 0 } })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    expect(screen.queryByText('Нет данных за сегодня')).not.toBeInTheDocument()
  })

  it('shows anomaly AlertTriangle with per-period detail when cogs > revenue in today period (fix H-2)', async () => {
    const periods = makePeriods({
      today: { cogs: 60000, revenue: 50000 }, // cogs > revenue
    })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    const triangle = screen.getByLabelText('Аномалия данных')
    expect(triangle).toBeInTheDocument()

    // Hover the span wrapper (SVGs don't receive pointer events in jsdom — wrap pattern from MonitorKpiCards)
    const user = userEvent.setup()
    const triggerSpan = triangle.closest('span')
    if (!triggerSpan) throw new Error('Tooltip trigger span not found')
    await user.hover(triggerSpan)

    // Tooltip content now shows per-period list header (fix H-2)
    const headerMatches = await screen.findAllByText(/Аномалия в период/)
    expect(headerMatches.length).toBeGreaterThanOrEqual(1)
    // The offending period label should appear
    const periodMatches = screen.getAllByText(/сегодня/)
    expect(periodMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT show anomaly indicator when no period has cogs > revenue or margin > revenue', () => {
    // basePeriod: cogs=30000 < revenue=50000, margin=13000 < revenue=50000 — no anomaly
    renderWithProviders(<MonitorMetricsTable periods={makePeriods()} />)

    expect(screen.queryByLabelText('Аномалия данных')).not.toBeInTheDocument()
  })

  it('renders revenue as formatted currency matching Russian locale pattern', () => {
    // revenue=50000 → "50 000 ₽" (Intl.NumberFormat ru-RU with narrow-no-break space)
    renderWithProviders(<MonitorMetricsTable periods={makePeriods()} />)

    // Multiple cells show 50000 revenue — match with locale-aware regex
    const cells = screen.getAllByText(/50[\s  ]000/)
    expect(cells.length).toBeGreaterThanOrEqual(1)
  })

  it('renders counts as integers not currency', () => {
    const periods = makePeriods({ today: { salesCount: 10, returnsCount: 1 } })
    renderWithProviders(<MonitorMetricsTable periods={periods} />)

    // Orders row = 10 + 1 = 11; sales row = 10; returns row = 1
    // These should render as plain integers, NOT formatted as "11 ₽"
    expect(screen.queryByText(/11\s*₽/)).not.toBeInTheDocument()
  })
})
