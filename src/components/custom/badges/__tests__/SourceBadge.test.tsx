/**
 * SourceBadge unit tests — Story 96.15-FE
 *
 * Coverage:
 *   - All 5 BuyoutSource values render correct label + color classes
 *   - aria-label present per source (a11y — Story 96.10 M2-1 + 96.14 M2-2 lessons)
 *   - NO role="button" (anti-pattern per focus-based tooltip disclosure rule)
 *   - data-testid=`source-badge-${source}` present on badge span (L-1 fix: no multi-row collision)
 *   - 'unknown' renders AlertTriangle indicator (M-3 fix: Defensive Frontend Principle)
 *   - Pattern 3 wiring: imports from src/test/fixtures/buyout-analytics.ts
 *
 * 1st-pass review fixes applied:
 *   H-1: 'blended' label updated to "Комбинированный" (matches dropdown)
 *   L-1: testid queries use scoped `source-badge-${source}` pattern
 *   M-3: 'unknown' variant tests added
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SourceBadge } from '../SourceBadge'
import { withSdkReconciliationItem } from '@/test/fixtures/buyout-analytics'
import type { BuyoutSource } from '@/types/analytics-buyout'

// Tooltip requires no special mock — TooltipProvider wraps internally in SourceBadge.

describe('SourceBadge', () => {
  describe('sdk_reconciliation', () => {
    it('renders label "SDK"', () => {
      renderWithProviders(<SourceBadge source="sdk_reconciliation" />)
      expect(screen.getByTestId('source-badge-sdk_reconciliation')).toHaveTextContent('SDK')
    })

    it('applies indigo color classes', () => {
      renderWithProviders(<SourceBadge source="sdk_reconciliation" />)
      const badge = screen.getByTestId('source-badge-sdk_reconciliation')
      expect(badge.className).toContain('bg-indigo-100')
      expect(badge.className).toContain('text-indigo-700')
      expect(badge.className).toContain('border-indigo-300')
    })

    it('has correct aria-label', () => {
      renderWithProviders(<SourceBadge source="sdk_reconciliation" />)
      expect(screen.getByTestId('source-badge-sdk_reconciliation')).toHaveAttribute(
        'aria-label',
        'Источник: SDK-сверка (наивысшая точность)'
      )
    })
  })

  describe('weekly', () => {
    it('renders label "Недельный"', () => {
      renderWithProviders(<SourceBadge source="weekly" />)
      expect(screen.getByTestId('source-badge-weekly')).toHaveTextContent('Недельный')
    })

    it('applies gray color classes', () => {
      renderWithProviders(<SourceBadge source="weekly" />)
      const badge = screen.getByTestId('source-badge-weekly')
      expect(badge.className).toContain('bg-gray-100')
      expect(badge.className).toContain('text-gray-700')
      expect(badge.className).toContain('border-gray-300')
    })

    it('has correct aria-label', () => {
      renderWithProviders(<SourceBadge source="weekly" />)
      expect(screen.getByTestId('source-badge-weekly')).toHaveAttribute(
        'aria-label',
        'Источник: недельный отчёт WB'
      )
    })
  })

  describe('realtime', () => {
    it('renders label "Realtime"', () => {
      renderWithProviders(<SourceBadge source="realtime" />)
      expect(screen.getByTestId('source-badge-realtime')).toHaveTextContent('Realtime')
    })

    it('applies green color classes', () => {
      renderWithProviders(<SourceBadge source="realtime" />)
      const badge = screen.getByTestId('source-badge-realtime')
      expect(badge.className).toContain('bg-green-100')
      expect(badge.className).toContain('text-green-700')
      expect(badge.className).toContain('border-green-300')
    })

    it('has correct aria-label', () => {
      renderWithProviders(<SourceBadge source="realtime" />)
      expect(screen.getByTestId('source-badge-realtime')).toHaveAttribute(
        'aria-label',
        'Источник: данные в реальном времени'
      )
    })
  })

  describe('blended', () => {
    // H-1 fix: label unified to "Комбинированный" — matches BuyoutPageContent.tsx dropdown (line 37).
    it('renders label "Комбинированный"', () => {
      renderWithProviders(<SourceBadge source="blended" />)
      expect(screen.getByTestId('source-badge-blended')).toHaveTextContent('Комбинированный')
    })

    it('applies amber color classes', () => {
      renderWithProviders(<SourceBadge source="blended" />)
      const badge = screen.getByTestId('source-badge-blended')
      expect(badge.className).toContain('bg-amber-100')
      expect(badge.className).toContain('text-amber-800')
      expect(badge.className).toContain('border-amber-300')
    })

    it('has correct aria-label', () => {
      renderWithProviders(<SourceBadge source="blended" />)
      expect(screen.getByTestId('source-badge-blended')).toHaveAttribute(
        'aria-label',
        'Источник: комбинированный (смешанный)'
      )
    })
  })

  describe('unknown — M-3 fix: Story 96.14 parity + Defensive Frontend Principle', () => {
    it('renders label "Неизвестен"', () => {
      renderWithProviders(<SourceBadge source="unknown" />)
      expect(screen.getByTestId('source-badge-unknown')).toHaveTextContent('Неизвестен')
    })

    it('renders AlertTriangle indicator for unknown source', () => {
      renderWithProviders(<SourceBadge source="unknown" />)
      // AlertTriangle is aria-hidden, so query by role=img is not available.
      // Verify the badge container exists and contains the SVG element via lucide class.
      const badge = screen.getByTestId('source-badge-unknown')
      expect(badge).toBeInTheDocument()
      // The badge should contain an svg element (AlertTriangle from lucide-react)
      const svgEl = badge.querySelector('svg')
      expect(svgEl).not.toBeNull()
    })

    it('applies neutral gray styling for unknown source', () => {
      renderWithProviders(<SourceBadge source="unknown" />)
      const badge = screen.getByTestId('source-badge-unknown')
      expect(badge.className).toContain('bg-gray-100')
      expect(badge.className).toContain('text-gray-600')
      expect(badge.className).toContain('border-gray-300')
    })

    it('has correct aria-label for unknown source', () => {
      renderWithProviders(<SourceBadge source="unknown" />)
      expect(screen.getByTestId('source-badge-unknown')).toHaveAttribute(
        'aria-label',
        'Источник не распознан'
      )
    })
  })

  describe('a11y — Story 96.10 M2-1 + 96.14 M2-2 lessons', () => {
    it('has tabIndex=0 for keyboard accessibility on each source', () => {
      const sources: BuyoutSource[] = [
        'sdk_reconciliation',
        'weekly',
        'realtime',
        'blended',
        'unknown',
      ]
      for (const source of sources) {
        const { unmount } = renderWithProviders(<SourceBadge source={source} />)
        expect(screen.getByTestId(`source-badge-${source}`)).toHaveAttribute('tabindex', '0')
        unmount()
      }
    })

    it('does NOT have role="button" on badge span', () => {
      const sources: BuyoutSource[] = [
        'sdk_reconciliation',
        'weekly',
        'realtime',
        'blended',
        'unknown',
      ]
      for (const source of sources) {
        const { unmount } = renderWithProviders(<SourceBadge source={source} />)
        const badge = screen.getByTestId(`source-badge-${source}`)
        expect(badge).not.toHaveAttribute('role', 'button')
        unmount()
      }
    })
  })

  describe('Pattern 3 fixture wiring (Story 96.15-FE)', () => {
    it('renders sdk_reconciliation badge for fixture item source', () => {
      const item = withSdkReconciliationItem()
      // Type assertion: item.source is 'sdk_reconciliation' — valid BuyoutSource
      renderWithProviders(<SourceBadge source={item.source} />)
      expect(screen.getByTestId('source-badge-sdk_reconciliation')).toHaveTextContent('SDK')
    })
  })
})
