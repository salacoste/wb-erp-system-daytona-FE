/**
 * OrganicTab unit tests — Story 168.7 (shadcn semantic-token migration),
 * re-pinned per owner decision (a) 2026-09-12 (debt-p2-80-sweep A2):
 * positive tiers both carry FULL `text-financial-positive` text (5.13:1 AA;
 * the old /80 variant failed WCAG 1.4.3) and the tier distance moved to the
 * non-text icon channel — effective = opacity-80 icon (3.51:1 ≥3 non-text,
 * 1.4.11), highly_effective = full-opacity icon. `text-financial-positive/80`
 * is pinned as FORBIDDEN (re-inflation guard). Also pins the 3 confidence
 * branches and a scoped legacy DOM guard against raw-palette classes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrganicTab } from '../OrganicTab'
import type { CorrelationDayItem, IncrementalRoasData } from '@/types/unified-product'

function makeDay(overrides: Partial<CorrelationDayItem> = {}): CorrelationDayItem {
  return {
    date: '2026-08-10',
    nmId: '12345',
    adOrders: 12,
    estimatedAdCart: 15,
    organicCart: 40,
    confidence: 'high',
    campaigns: [{ advertId: 1, adOrders: 12, spend: 500, estimatedAdCart: 15 }],
    ...overrides,
  }
}

function makeIroas(interpretation: IncrementalRoasData['interpretation']): IncrementalRoasData {
  return {
    nmId: '12345',
    period: { from: '2026-08-01', to: '2026-08-10' },
    totalRevenue: 100000,
    estimatedOrganicRevenue: 40000,
    adSpend: 20000,
    incrementalRevenue: 60000,
    iROAS: 3,
    interpretation,
    organicCannibalizationPct: 40,
    totalOrders: 100,
    estimatedOrganicOrders: 40,
  }
}

/** Verdict is the only element carrying the label text. */
function verdictByLabel(text: string): HTMLElement {
  return screen.getByText(text)
}

describe('OrganicTab — 168.7 semantic tokens', () => {
  describe('iroasLabel tiers (4 distinct intensities, no tier-collapse)', () => {
    it('highly_effective → full positive text + full-opacity check icon', () => {
      render(<OrganicTab correlation={[]} iroas={makeIroas('highly_effective')} />)
      const el = verdictByLabel('Очень эффективно')
      expect(el.classList.contains('text-financial-positive')).toBe(true)
      expect(el.classList.contains('text-financial-positive/80')).toBe(false)
      const icon = el.querySelector('svg')
      expect(icon).not.toBeNull()
      expect(icon?.classList.contains('text-financial-positive')).toBe(true)
      expect(icon?.classList.contains('opacity-80')).toBe(false)
    })

    it('effective → full positive text (NO /80 re-inflation) + dimmed icon channel', () => {
      render(<OrganicTab correlation={[]} iroas={makeIroas('effective')} />)
      const el = verdictByLabel('Эффективно')
      // Text channel: full token only — /80 failed WCAG 1.4.3 (3.51:1).
      expect(el.classList.contains('text-financial-positive')).toBe(true)
      expect(el.classList.contains('text-financial-positive/80')).toBe(false)
      // Non-text channel: opacity-80 icon carries the tier distance from
      // highly_effective (3.51:1 light / 6.34:1 dark ≥ 3:1 per WCAG 1.4.11).
      const icon = el.querySelector('svg')
      expect(icon).not.toBeNull()
      expect(icon?.classList.contains('text-financial-positive')).toBe(true)
      expect(icon?.classList.contains('opacity-80')).toBe(true)
      expect(icon?.getAttribute('aria-hidden')).toBe('true')
    })

    it('marginal → text-status-warning (full, single warning tier, no icon)', () => {
      render(<OrganicTab correlation={[]} iroas={makeIroas('marginal')} />)
      const el = verdictByLabel('На грани')
      expect(el.classList.contains('text-status-warning')).toBe(true)
      expect(el.classList.contains('text-status-warning/80')).toBe(false)
      expect(el.querySelector('svg')).toBeNull()
    })

    it('ineffective → text-financial-negative (no icon)', () => {
      render(<OrganicTab correlation={[]} iroas={makeIroas('ineffective')} />)
      const el = verdictByLabel('Неэффективно')
      expect(el.classList.contains('text-financial-negative')).toBe(true)
      expect(el.querySelector('svg')).toBeNull()
    })

    it('unknown BE tier (defensive drift path) → raw label, muted, no icon', () => {
      // BE introduced a 5th tier outside the closed union — Defensive Frontend:
      // render raw text muted, never crash, never leak a positive-tier icon.
      render(
        <OrganicTab
          correlation={[]}
          iroas={{ ...makeIroas('effective'), interpretation: 'super_effective' as never }}
        />
      )
      const el = verdictByLabel('super_effective')
      expect(el.classList.contains('text-muted-foreground')).toBe(true)
      expect(el.querySelector('svg')).toBeNull()
    })

    it('iroas=null → «Нет данных» muted (no icon)', () => {
      render(<OrganicTab correlation={[]} iroas={null} />)
      const el = verdictByLabel('Нет данных')
      expect(el.classList.contains('text-muted-foreground')).toBe(true)
      expect(el.querySelector('svg')).toBeNull()
    })
  })

  describe('confidence column (data-quality, not financial)', () => {
    const days: CorrelationDayItem[] = [
      makeDay({ date: '2026-08-01', confidence: 'high' }),
      makeDay({ date: '2026-08-02', confidence: 'medium' }),
      makeDay({ date: '2026-08-03', confidence: 'low' }),
    ]

    it('high → text-status-information', () => {
      render(<OrganicTab correlation={days} iroas={null} />)
      const row = screen.getByText('2026-08-01').closest('tr') as HTMLElement
      const cell = row.querySelector('td:last-child span') as HTMLElement
      expect(cell.classList.contains('text-status-information')).toBe(true)
    })

    it('medium → text-status-warning', () => {
      render(<OrganicTab correlation={days} iroas={null} />)
      const row = screen.getByText('2026-08-02').closest('tr') as HTMLElement
      const cell = row.querySelector('td:last-child span') as HTMLElement
      expect(cell.classList.contains('text-status-warning')).toBe(true)
    })

    it('low → text-muted-foreground (untouched fallback)', () => {
      render(<OrganicTab correlation={days} iroas={null} />)
      const row = screen.getByText('2026-08-03').closest('tr') as HTMLElement
      const cell = row.querySelector('td:last-child span') as HTMLElement
      expect(cell.classList.contains('text-muted-foreground')).toBe(true)
    })
  })

  describe('legacy DOM guard', () => {
    it('renders no raw-palette classes in owned output', () => {
      const days: CorrelationDayItem[] = [
        makeDay({ date: '2026-08-01', confidence: 'high' }),
        makeDay({ date: '2026-08-02', confidence: 'medium' }),
        makeDay({ date: '2026-08-03', confidence: 'low' }),
      ]
      const { container } = render(<OrganicTab correlation={days} iroas={makeIroas('marginal')} />)
      const legacy =
        /(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?/
      expect(container.innerHTML.match(legacy)).toBeNull()
    })
  })
})
