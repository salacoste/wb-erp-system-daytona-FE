import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  CHART_FEATURES,
  STORY_174_3_SURFACE_CONTRACTS,
  TABLE_FEATURES,
} from '../../e2e/fixtures/story-174-3-surface-contracts'
import { STORY_174_3_ROUTE_EVIDENCE } from '../../e2e/fixtures/story-174-3-visual-accessibility'

const REQUIRED_OVERLAY_ROUTES = [
  '/settings/backfill',
  '/settings/expenses',
  '/settings/notifications',
  '/analytics/advertising',
  '/analytics/search',
  '/dashboard',
  '/cogs/history',
  '/cogs/price-calculator',
  '/shipments',
  '/monitoring',
  '/supplies',
  '/supplies/[id]',
] as const

const REQUIRED_TABLE_COUNTS: Readonly<Record<string, number>> = {
  '/analytics': 6,
  '/analytics/finance-history': 1,
  '/analytics/pricing': 2,
  '/analytics/reorder': 1,
  '/analytics/sku': 1,
  '/analytics/acquiring': 1,
  '/analytics/acquiring/reports/[id]': 1,
  '/analytics/buyout': 1,
  '/analytics/buyout-reconciliation': 1,
  '/analytics/fbs-stock': 3,
  '/analytics/funnel': 1,
  '/analytics/gaps': 1,
  '/analytics/unit-economics': 1,
  '/analytics/liquidity': 1,
  '/analytics/returns': 1,
  '/analytics/storage': 2,
  '/analytics/supply-planning': 1,
  '/analytics/advertising': 2,
  '/analytics/brand': 1,
  '/analytics/category': 1,
  '/analytics/cross-reference': 1,
  '/analytics/search': 1,
  '/analytics/ai-admin/anomalies': 1,
  '/analytics/ai-admin/models': 1,
  '/analytics/forecast': 1,
  '/analytics/forecast-accuracy': 2,
  '/analytics/models': 1,
  '/analytics/models/[id]/evaluations': 1,
  '/analytics/models/[id]/evaluations/sku-accuracy': 1,
  '/analytics/models/[id]/performance': 1,
  '/analytics/dashboard': 2,
  '/cogs/history': 1,
  '/cogs': 1,
  '/cogs/bulk': 1,
  '/finances': 1,
  '/monitor': 1,
  '/monitoring': 1,
  '/orders': 1,
  '/orders/fbo': 2,
  '/orders/integrity': 1,
  '/products': 1,
  '/settings/expenses': 1,
  '/settings/backfill': 1,
  '/settings/tariffs': 1,
  '/shipments': 1,
  '/shipments/[id]': 1,
  '/shipments/box-types': 1,
  '/shipments/sku-packaging': 1,
  '/supplies': 1,
  '/supplies/[id]': 1,
}

const REQUIRED_CHART_COUNTS: Readonly<Record<string, number>> = {
  '/analytics/orders': 1,
  '/analytics/time-period': 1,
  '/analytics/unit-economics': 1,
  '/analytics/liquidity': 3,
  '/analytics/buyout': 1,
  '/analytics/returns': 1,
  '/analytics/storage': 1,
  '/analytics/advertising': 2,
  '/analytics/brand-share': 1,
  '/analytics/search': 1,
  '/analytics/forecast': 1,
  '/analytics/models/[id]/performance': 1,
  '/dashboard': 2,
}

describe('Story 174.3 fail-closed surface contracts', () => {
  it('declares an exhaustive route-specific overlay inventory', () => {
    expect(Object.keys(STORY_174_3_SURFACE_CONTRACTS)).toHaveLength(76)

    for (const row of STORY_174_3_ROUTE_EVIDENCE) {
      const contract = STORY_174_3_SURFACE_CONTRACTS[row.route]
      expect(contract.overlay.disposition).toBe('executed')
      expect(contract.overlay.expectedCount).toBe(contract.overlay.inventory.length)
      expect(contract.overlay.evidenceSource).toBe(row.entry)

      for (const conditional of contract.overlay.conditionalInventory) {
        expect(conditional.disposition).toBe('not-applicable-in-canonical-default')
        expect(conditional.rationale).toContain(row.route)
      }

      for (const overlay of [
        ...contract.overlay.inventory,
        ...contract.overlay.conditionalInventory.map(item => item.item),
      ]) {
        expect(overlay.id).toMatch(/^[a-z0-9-]+$/)
        expect(overlay.archetype).toMatch(
          /^(?:modal-dialog|modal-alert-dialog|modal-sheet|non-modal-popover|non-modal-menu)$/
        )
        expect(overlay.defaultState).toBe('closed')
        expect(overlay.trigger.role).toMatch(/^(?:button|combobox|link)$/)
        expect(overlay.trigger.name).not.toBe('')
        expect(overlay.trigger.cardinality ?? 'exactly-one').toMatch(
          /^(?:exactly-one|one-or-more)$/
        )
        expect(overlay.evidence.source).toMatch(/^src\/.+\.tsx$/)
        expect(existsSync(overlay.evidence.source)).toBe(true)
        expect(readFileSync(overlay.evidence.source, 'utf8')).toContain(overlay.evidence.anchor)
      }
    }

    expect(STORY_174_3_SURFACE_CONTRACTS['/dashboard'].overlay.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'mobile-navigation', archetype: 'modal-sheet' }),
      ])
    )
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics/funnel'].overlay.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'product-filter', archetype: 'non-modal-popover' }),
      ])
    )
    for (const route of REQUIRED_OVERLAY_ROUTES) {
      const overlay = STORY_174_3_SURFACE_CONTRACTS[route].overlay
      expect(overlay.inventory.length + overlay.conditionalInventory.length, route).toBeGreaterThan(
        1
      )
    }
  })

  it('declares exact table and chart counts, stable selectors, and explicit feature dispositions', () => {
    for (const row of STORY_174_3_ROUTE_EVIDENCE) {
      const contract = STORY_174_3_SURFACE_CONTRACTS[row.route]

      for (const [surfaceKind, featureNames] of [
        ['table', TABLE_FEATURES],
        ['chart', CHART_FEATURES],
      ] as const) {
        const surface = contract[surfaceKind]
        expect(surface.expectedCount).toBe(surface.surfaces.length)
        expect(surface.evidenceSource).toBe(row.entry)
        expect(surface.emptyRationale).toContain(row.route)
        expect(new Set(surface.surfaces.map(item => item.id)).size).toBe(surface.expectedCount)
        expect(new Set(surface.surfaces.map(item => item.selector)).size).toBe(
          surface.expectedCount
        )

        for (const conditional of surface.conditionalSurfaces) {
          expect(conditional.disposition).toBe('not-applicable-in-canonical-default')
          expect(conditional.rationale).toContain(row.route)
        }

        const knownSurfaces = [
          ...surface.surfaces,
          ...surface.conditionalSurfaces.map(item => item.item),
        ]
        expect(new Set(knownSurfaces.map(item => item.id)).size).toBe(knownSurfaces.length)

        for (const expected of knownSurfaces) {
          expect(expected.selector).not.toMatch(/^(?:table|\[role="table"\]|svg|canvas)$/)
          expect(expected.accessibleName).not.toBe('')
          expect(existsSync(expected.evidence.source)).toBe(true)
          expect(readFileSync(expected.evidence.source, 'utf8')).toContain(expected.evidence.anchor)
          expect(Object.keys(expected.features).sort()).toEqual([...featureNames].sort())
          for (const [feature, disposition] of Object.entries(expected.features)) {
            expect(disposition.disposition).toMatch(/^(?:executed|not-applicable)$/)
            expect(disposition.rationale).toContain(feature)
            expect(disposition.rationale).toContain(row.route)
          }

          if ('narrowWidthDisposition' in expected) {
            expect(expected.narrowWidthDisposition.disposition).toMatch(
              /^(?:executed|not-applicable)$/
            )
            expect(expected.narrowWidthDisposition.rationale).toContain(row.route)
          }

          if ('alternative' in expected) {
            expect(expected.alternative.association).toBe('explicit-accessible-name')
            expect(expected.alternative.selector).not.toBe('[data-chart-summary]')
            expect(expected.alternative.accessibleName).not.toBe('')
          }
        }
      }
    }
  })

  it('pins known required surfaces so disappearance cannot become N/A', () => {
    for (const [route, expectedCount] of Object.entries(REQUIRED_TABLE_COUNTS)) {
      const table = STORY_174_3_SURFACE_CONTRACTS[route].table
      expect(table.surfaces.length + table.conditionalSurfaces.length, route).toBe(expectedCount)
    }
    for (const [route, expectedCount] of Object.entries(REQUIRED_CHART_COUNTS)) {
      const chart = STORY_174_3_SURFACE_CONTRACTS[route].chart
      expect(chart.surfaces.length + chart.conditionalSurfaces.length, route).toBe(expectedCount)
    }
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics/dashboard'].table.expectedCount).toBe(2)
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics/dashboard'].chart.expectedCount).toBe(0)
    expect(STORY_174_3_SURFACE_CONTRACTS['/dashboard'].table.expectedCount).toBe(0)
    expect(STORY_174_3_SURFACE_CONTRACTS['/dashboard'].chart.expectedCount).toBe(2)
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics'].table.expectedCount).toBe(5)
    expect(
      STORY_174_3_SURFACE_CONTRACTS['/analytics'].table.conditionalSurfaces.map(
        item => item.item.id
      )
    ).toContain('financial-summary-profit')
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics/fbs-stock'].table.expectedCount).toBe(1)
    expect(
      STORY_174_3_SURFACE_CONTRACTS['/analytics/fbs-stock'].table.conditionalSurfaces.map(
        item => item.item.id
      )
    ).toEqual(expect.arrayContaining(['fbs-stock-sizes', 'fbs-stock-regions']))
    expect(STORY_174_3_SURFACE_CONTRACTS['/orders/integrity'].table.expectedCount).toBe(1)
    expect(STORY_174_3_SURFACE_CONTRACTS['/settings/backfill'].table.expectedCount).toBe(1)
    expect(STORY_174_3_SURFACE_CONTRACTS['/analytics/advertising'].overlay.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'efficiency-filter',
          trigger: expect.objectContaining({ role: 'combobox' }),
        }),
      ])
    )
  })

  it('keeps the runner fail-closed without counting hidden Radix inputs or obsolete gaps', () => {
    const runner = readFileSync('e2e/shadcn-migration-visual-accessibility.spec.ts', 'utf8')
    expect(runner).toContain('input[aria-hidden="true"]')
    expect(runner).toContain('input[type="hidden"]')
    expect(runner).toContain('input[tabindex="-1"]')
    expect(runner).toContain('.filter(visible)')
    expect(runner).not.toContain('dedicatedBrowserGap')
  })
})
