/**
 * ReturnReasonsPieChart smoke tests — Epic 70-FE
 *
 * Covers: loading skeleton, error alert, empty state, happy-path with
 * categories rendered (stacked bar + donut chart + category rows).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { ReturnReasonsResponse } from '@/types/analytics-returns'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/use-return-analytics', () => ({
  useReturnReasons: vi.fn(),
}))

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { ReturnReasonsPieChart } from '../ReturnReasonsPieChart'

const mockUseReturnReasons = vi.mocked(useReturnReasons)

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockData: ReturnReasonsResponse = {
  summary: {
    totalReturns: 120,
    cancelBeforeShipment: 40,
    refusalAtPvz: 30,
    returnAfterReceipt: 50,
    overallReturnRate: 3.2,
    classificationCoverage: 100,
  },
  byCategory: [
    {
      category: 'cancel_before_shipment',
      displayName: 'До отправки',
      count: 40,
      percentage: 33.3,
      trend: 'up',
      trendDelta: 5.0,
    },
    {
      category: 'refusal_at_pvz',
      displayName: 'Отказ ПВЗ',
      count: 30,
      percentage: 25.0,
      trend: 'stable',
      trendDelta: 0,
    },
    {
      category: 'return_after_receipt',
      displayName: 'После получения',
      count: 50,
      percentage: 41.7,
      trend: 'down',
      trendDelta: -3.0,
    },
  ],
  period: { from: '2026-05-01', to: '2026-05-31' },
}

function hookReturn(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useReturnReasons>
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ReturnReasonsPieChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows skeleton while loading', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = renderWithProviders(<ReturnReasonsPieChart />)
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('shows error alert when request fails', () => {
    mockUseReturnReasons.mockReturnValue(hookReturn({ isError: true }))
    renderWithProviders(<ReturnReasonsPieChart />)
    expect(screen.getByText(/Не удалось загрузить причины возвратов/)).toBeInTheDocument()
  })

  it('shows empty-state alert when no categories returned', () => {
    mockUseReturnReasons.mockReturnValue(
      hookReturn({
        data: {
          summary: {
            totalReturns: 0,
            overallReturnRate: 0,
            classificationCoverage: 0,
            cancelBeforeShipment: 0,
            refusalAtPvz: 0,
            returnAfterReceipt: 0,
          },
          byCategory: [],
          period: { from: '2026-01-01', to: '2026-01-31' },
        },
      })
    )
    renderWithProviders(<ReturnReasonsPieChart />)
    expect(screen.getByText(/Нет данных о причинах возвратов/)).toBeInTheDocument()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockUseReturnReasons.mockReturnValue(hookReturn({ data: mockData }))
    })

    it('renders the card title with total return count', () => {
      renderWithProviders(<ReturnReasonsPieChart />)
      expect(screen.getByText(/Причины возвратов/)).toBeInTheDocument()
    })

    it('renders all 3 category display names', () => {
      renderWithProviders(<ReturnReasonsPieChart />)
      expect(screen.getByText('До отправки')).toBeInTheDocument()
      expect(screen.getByText('Отказ ПВЗ')).toBeInTheDocument()
      expect(screen.getByText('После получения')).toBeInTheDocument()
    })

    it('renders category counts', () => {
      renderWithProviders(<ReturnReasonsPieChart />)
      // Counts appear in parentheses after percentages
      expect(screen.getByText('(40)')).toBeInTheDocument()
      expect(screen.getByText('(30)')).toBeInTheDocument()
      expect(screen.getByText('(50)')).toBeInTheDocument()
    })

    it('renders the donut chart SVG with center total', () => {
      const { container } = renderWithProviders(<ReturnReasonsPieChart />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Center text shows total returns
      expect(screen.getByText('120')).toBeInTheDocument()
      expect(screen.getByText('возвратов')).toBeInTheDocument()
    })

    it('renders the stacked bar as a flex container', () => {
      const { container } = renderWithProviders(<ReturnReasonsPieChart />)
      // Stacked bar is the first .flex.h-6 inside the card
      const bar = container.querySelector('.flex.h-6.rounded-full')
      expect(bar).toBeInTheDocument()
    })

    it('renders trend badges for up and down trends', () => {
      renderWithProviders(<ReturnReasonsPieChart />)
      // "До отправки" trend=up → ▲ (unicode 2191)
      expect(screen.getByText(/↑/)).toBeInTheDocument()
      // "После получения" trend=down → ▼ (unicode 2193)
      expect(screen.getByText(/↓/)).toBeInTheDocument()
    })

    it('Story 169.11 inversion pin: trend up renders negative-valence financial token', () => {
      renderWithProviders(<ReturnReasonsPieChart />)
      // For returns, up = worse → text-financial-negative (red preserved)
      const upBadge = screen.getByText(/↑/).closest('span')
      expect(upBadge?.className).toContain('text-financial-negative')
      const downBadge = screen.getByText(/↓/).closest('span')
      expect(downBadge?.className).toContain('text-financial-positive')
    })
  })

  // Story 169.11: real unknown-category state (Task 0 merged — 'unknown' is a
  // genuine ReturnCategory with neutral Russian label). Must render neutral
  // (muted), not alarming status colors and not a fabricated known category.
  describe('unknown category (Story 169.11)', () => {
    it('renders the neutral label with muted fallbacks, not status tokens', () => {
      mockUseReturnReasons.mockReturnValue(
        hookReturn({
          data: {
            summary: {
              totalReturns: 10,
              cancelBeforeShipment: 0,
              refusalAtPvz: 0,
              returnAfterReceipt: 0,
              overallReturnRate: 1,
              classificationCoverage: 50,
            },
            byCategory: [
              {
                category: 'unknown',
                displayName: 'Неклассифицированный возврат',
                count: 10,
                percentage: 100,
                trend: 'stable',
                trendDelta: 0,
              },
            ],
            period: { from: '2026-05-01', to: '2026-05-31' },
          },
        })
      )
      const { container } = renderWithProviders(<ReturnReasonsPieChart />)
      expect(screen.getByText('Неклассифицированный возврат')).toBeInTheDocument()
      // Swatch + percentage use muted fallbacks (bg-muted / text-muted-foreground)
      const swatch = screen.getByText('Неклассифицированный возврат').previousElementSibling
      expect(swatch?.className).toContain('bg-muted')
      const pct = screen.getByText(/100,0\s%/)
      expect(pct.className).toContain('text-muted-foreground')
      expect(pct.className).not.toMatch(/text-status-(error|warning|information)/)
      // Donut stroke falls back to the muted var (SVG stroke accepts vars)
      const circle = container.querySelector('circle')
      expect(circle?.getAttribute('stroke')).toBe('var(--color-muted-foreground)')
    })
  })
})
