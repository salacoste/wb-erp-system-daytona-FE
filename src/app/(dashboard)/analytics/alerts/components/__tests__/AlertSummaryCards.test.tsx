/**
 * AlertSummaryCards component tests
 *
 * Covers rendering of total alerts count, severity breakdown cards,
 * loading skeleton state, and zero-count handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlertSummaryCards } from '../AlertSummaryCards'
import type { AlertSummary } from '@/types/alerts'

// Partial mock: override formatNumber for deterministic output, keep cn for shadcn components
vi.mock('@/lib/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils')>()
  return {
    ...actual,
    formatNumber: (n: number) => String(n),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSummary(overrides: Partial<AlertSummary> = {}): AlertSummary {
  return {
    period: '7d',
    totalAlerts: 10,
    bySeverity: { critical: 2, warning: 5, info: 3 },
    byType: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('AlertSummaryCards', () => {
  it('renders total alerts count', () => {
    render(<AlertSummaryCards summary={makeSummary({ totalAlerts: 10 })} isLoading={false} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Всего за 7 дней')).toBeInTheDocument()
  })

  it('renders critical severity count', () => {
    render(
      <AlertSummaryCards
        summary={makeSummary({ bySeverity: { critical: 7, warning: 0, info: 0 } })}
        isLoading={false}
      />
    )
    expect(screen.getByText('Критические')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders warning severity count', () => {
    render(
      <AlertSummaryCards
        summary={makeSummary({ bySeverity: { critical: 0, warning: 12, info: 0 } })}
        isLoading={false}
      />
    )
    expect(screen.getByText('Предупреждения')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders info severity count', () => {
    render(
      <AlertSummaryCards
        summary={makeSummary({ bySeverity: { critical: 0, warning: 0, info: 9 } })}
        isLoading={false}
      />
    )
    expect(screen.getByText('Информационные')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('shows dash when summary is undefined', () => {
    render(<AlertSummaryCards summary={undefined} isLoading={false} />)
    // totalAlerts is undefined → renders '—'
    const dashElements = screen.getAllByText('—')
    // totalAlerts card shows dash; severity cards default to 0 via ?? 0
    expect(dashElements.length).toBeGreaterThanOrEqual(1)
    // severity cards still show 0 (three of them)
    expect(screen.getAllByText('0')).toHaveLength(3)
  })

  it('handles all-zero counts', () => {
    render(
      <AlertSummaryCards
        summary={makeSummary({ totalAlerts: 0, bySeverity: { critical: 0, warning: 0, info: 0 } })}
        isLoading={false}
      />
    )
    // All four cards show "0"
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(4)
  })

  it('handles missing bySeverity keys (defaults to 0)', () => {
    render(<AlertSummaryCards summary={makeSummary({ bySeverity: {} })} isLoading={false} />)
    // severity cards default to 0 via ?? 0
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3)
  })

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<AlertSummaryCards summary={undefined} isLoading={true} />)
    // Skeleton renders as divs with animate-pulse class
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(4)
  })

  it('does not render card content while loading', () => {
    render(<AlertSummaryCards summary={makeSummary()} isLoading={true} />)
    expect(screen.queryByText('Всего за 7 дней')).not.toBeInTheDocument()
  })

  it('renders all four card labels', () => {
    render(<AlertSummaryCards summary={makeSummary()} isLoading={false} />)
    expect(screen.getByText('Всего за 7 дней')).toBeInTheDocument()
    expect(screen.getByText('Критические')).toBeInTheDocument()
    expect(screen.getByText('Предупреждения')).toBeInTheDocument()
    expect(screen.getByText('Информационные')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Story 168.2: semantic tone tokens (shadcn migration)
// ---------------------------------------------------------------------------

describe('AlertSummaryCards — semantic tone tokens (168.2)', () => {
  const LEGACY_PALETTE_RE =
    /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/

  it.each([
    ['Критические', 'bg-status-error'],
    ['Предупреждения', 'bg-status-warning'],
    ['Информационные', 'bg-status-information'],
  ] as const)('renders %s chip with semantic class %s', (label, token) => {
    const { container } = render(<AlertSummaryCards summary={makeSummary()} isLoading={false} />)
    // Exact full-class-token match (classList.contains) — no substring false-pass
    const chip = Array.from(container.querySelectorAll<HTMLElement>('*')).find(el =>
      el.classList.contains(token)
    )
    expect(chip).toBeDefined()
    expect(container.textContent).toContain(label)
  })

  it('renders no legacy palette classes in the DOM', () => {
    const { container } = render(<AlertSummaryCards summary={makeSummary()} isLoading={false} />)
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})
