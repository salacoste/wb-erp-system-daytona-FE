import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  CHART_FEATURES,
  STORY_174_3_SURFACE_CONTRACTS,
  TABLE_FEATURES,
} from '../../e2e/fixtures/story-174-3-surface-contracts'
import { STORY_174_3_ROUTE_EVIDENCE } from '../../e2e/fixtures/story-174-3-visual-accessibility'
import type {
  Story1743ConditionalVerification,
  Story1743OwnerTestBinding,
} from '../../e2e/fixtures/story-174-3/surface-types'
import type { Story1743ExecutionManifest } from '../../e2e/fixtures/story-174-3/execution-manifest'

const EXECUTION_MANIFEST = JSON.parse(
  readFileSync('e2e/fixtures/story-174-3/execution-manifest.json', 'utf8')
) as Story1743ExecutionManifest

function expectOwnerTestBinding(binding: Story1743OwnerTestBinding) {
  expect(binding.execution).toBe('owner-test')
  expect(binding.runner).toMatch(/^(?:vitest|playwright)$/)
  expect(binding.source).not.toBe('')
  expect(binding.scenarioId).not.toBe('')
  expect(existsSync(binding.source)).toBe(true)

  const source = readFileSync(binding.source, 'utf8')
  expect(
    source.split(binding.scenarioId).length - 1,
    `${binding.source} :: ${binding.scenarioId}`
  ).toBe(1)
  const sourceSha256 = createHash('sha256').update(source).digest('hex')
  const entry = EXECUTION_MANIFEST.entries.find(
    candidate => candidate.source === binding.source && candidate.scenarioId === binding.scenarioId
  )
  expect(entry, `${binding.source} :: ${binding.scenarioId}`).toEqual(
    expect.objectContaining({
      exitCode: 0,
      result: 'passed',
      runner: binding.runner,
      sourceSha256,
    })
  )
}

function expectConditionalVerification(verification: Story1743ConditionalVerification) {
  if (verification.execution === 'owner-test') {
    expectOwnerTestBinding(verification)
    return
  }
  expect(verification.role).toMatch(/^(?:button|tab)$/)
  expect(verification.name).not.toBe('')
  expect(verification.restoreName).not.toBe('')
  expect(verification.activationKey).toBe('Enter')
}

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
  it('locks authoritative surface and feature counters to committed exports', () => {
    const contracts = Object.values(STORY_174_3_SURFACE_CONTRACTS)
    const tableSurfaces = contracts.flatMap(contract => [
      ...contract.table.surfaces,
      ...contract.table.conditionalSurfaces.map(item => item.item),
    ])
    const chartSurfaces = contracts.flatMap(contract => [
      ...contract.chart.surfaces,
      ...contract.chart.conditionalSurfaces.map(item => item.item),
    ])
    const features = [...tableSurfaces, ...chartSurfaces].flatMap(surface =>
      Object.values(surface.features)
    )

    expect({
      overlaysExecuted: contracts.reduce(
        (count, contract) => count + contract.overlay.inventory.length,
        0
      ),
      overlaysConditional: contracts.reduce(
        (count, contract) => count + contract.overlay.conditionalInventory.length,
        0
      ),
      tablesExecuted: contracts.reduce(
        (count, contract) => count + contract.table.surfaces.length,
        0
      ),
      tablesConditional: contracts.reduce(
        (count, contract) => count + contract.table.conditionalSurfaces.length,
        0
      ),
      chartsExecuted: contracts.reduce(
        (count, contract) => count + contract.chart.surfaces.length,
        0
      ),
      chartsConditional: contracts.reduce(
        (count, contract) => count + contract.chart.conditionalSurfaces.length,
        0
      ),
      featuresExecuted: features.filter(feature => feature.disposition === 'executed').length,
      featuresNotApplicable: features.filter(feature => feature.disposition === 'not-applicable')
        .length,
    }).toEqual({
      overlaysExecuted: 83,
      overlaysConditional: 15,
      tablesExecuted: 42,
      tablesConditional: 21,
      chartsExecuted: 13,
      chartsConditional: 4,
      featuresExecuted: 292,
      featuresNotApplicable: 331,
    })
  })

  it('pins interactive model-evaluation table features as executed rather than N/A', () => {
    const table =
      STORY_174_3_SURFACE_CONTRACTS['/analytics/models/[id]/evaluations'].table
        .conditionalSurfaces[0]!.item

    expect(table.features.sorting.disposition).toBe('executed')
    expect(table.features['selection-and-actions'].disposition).toBe('executed')
    expect(table.ownerFeatureExecution).toEqual(
      expect.objectContaining({
        features: ['sorting', 'selection-and-actions'],
        verification: expect.objectContaining({
          execution: 'owner-test',
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsTable.test.tsx',
          scenarioId:
            'F-1/F-6: sorting and native SKU action remain executable without focusable rows',
        }),
      })
    )
  })

  it('declares an exhaustive route-specific overlay inventory', () => {
    expect(Object.keys(STORY_174_3_SURFACE_CONTRACTS)).toHaveLength(76)

    for (const row of STORY_174_3_ROUTE_EVIDENCE) {
      const contract = STORY_174_3_SURFACE_CONTRACTS[row.route]
      expect(contract.keyboard.surface).toBe('main-or-route-body')
      expect(contract.keyboard.rationale).toContain(row.route)
      expect(contract.overlay.disposition).toBe('executed')
      expect(contract.overlay.expectedCount).toBe(contract.overlay.inventory.length)
      expect(contract.overlay.evidenceSource).toBe(row.entry)

      for (const conditional of contract.overlay.conditionalInventory) {
        expect(conditional.disposition).toBe('not-applicable-in-canonical-default')
        expect(conditional.rationale).toContain(row.route)
        expectConditionalVerification(conditional.verification)
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

      for (const overlay of contract.overlay.inventory) {
        expect(overlay.behavior).toEqual({
          closeKey: 'Escape',
          execution: 'canonical-runner',
          openKey: 'Enter',
        })
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
    expect(
      STORY_174_3_SURFACE_CONTRACTS['/cogs/price-calculator'].overlay.conditionalInventory.map(
        item => item.item
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'reset-confirmation', archetype: 'modal-dialog' }),
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
          expectConditionalVerification(conditional.verification)
          if (conditional.verification.execution === 'owner-test') {
            const executedFeatures = Object.entries(conditional.item.features)
              .filter(([, feature]) => feature.disposition === 'executed')
              .map(([feature]) => feature)
            const ownerExecutedFeatures =
              'ownerFeatureExecution' in conditional.item
                ? (conditional.item.ownerFeatureExecution?.features ?? [])
                : []
            expect(
              executedFeatures,
              `${row.route}:${conditional.item.id} must not retain canonical feature claims outside the canonical default`
            ).toEqual(ownerExecutedFeatures)
          } else {
            expect(
              Object.values(conditional.item.features).some(
                feature => feature.disposition === 'executed'
              )
            ).toBe(true)
          }
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
            if (disposition.disposition === 'executed') {
              expect(disposition.assertion).toMatch(/^(?:canonical-runner|owner-test):/)
            }
          }
          const paginationFeature =
            'pagination' in expected.features ? expected.features.pagination : undefined
          if (surfaceKind === 'table' && paginationFeature?.disposition === 'executed') {
            expect('pagination' in expected && expected.pagination).toEqual({
              nextName: expect.any(String),
              previousName: expect.any(String),
              evidence: {
                anchor: expect.any(String),
                source: expect.stringMatching(/^src\/.+\.tsx$/),
              },
            })
            if ('pagination' in expected && expected.pagination) {
              expect(existsSync(expected.pagination.evidence.source)).toBe(true)
              expect(readFileSync(expected.pagination.evidence.source, 'utf8')).toContain(
                expected.pagination.evidence.anchor
              )
            }
          }

          if ('narrowWidthDisposition' in expected) {
            expect(expected.narrowWidthDisposition.disposition).toMatch(
              /^(?:executed|not-applicable)$/
            )
            expect(expected.narrowWidthDisposition.rationale).toContain(row.route)
            const actionsExecuted =
              expected.features['selection-and-actions'].disposition === 'executed'
            const conditional = surface.conditionalSurfaces.find(
              item => item.item.id === expected.id
            )
            if (conditional?.verification.execution === 'owner-test') {
              const ownerExecutedActions =
                expected.ownerFeatureExecution?.features.includes('selection-and-actions')
              expect(actionsExecuted, `${row.route}:${expected.id}`).toBe(
                Boolean(ownerExecutedActions)
              )
            } else {
              expect(Boolean(expected.interaction), `${row.route}:${expected.id}`).toBe(
                actionsExecuted
              )
            }
            if (expected.interaction) expectOwnerTestBinding(expected.interaction)
            if (expected.ownerFeatureExecution) {
              expectOwnerTestBinding(expected.ownerFeatureExecution.verification)
              for (const feature of expected.ownerFeatureExecution.features) {
                const disposition = expected.features[feature]
                expect(disposition.disposition).toBe('executed')
                if (disposition.disposition !== 'executed') {
                  throw new Error(`${row.route}:${expected.id}:${feature} lost owner execution`)
                }
                expect(disposition.assertion).toMatch(/^owner-test:/)
              }
            }
          }

          if ('alternative' in expected) {
            expect(expected.alternative.association).toMatch(
              /^(?:explicit-accessible-name|shared-complete-data-table)$/
            )
            expect(expected.alternative.selector).not.toBe('[data-chart-summary]')
            expect(expected.alternative.accessibleName).not.toBe('')
            expect(expected.alternative.requiredSeriesTokens.length).toBeGreaterThan(0)
            expectOwnerTestBinding(expected.tooltip)
            if (expected.alternative.association === 'shared-complete-data-table') {
              expect(expected.alternative.selector).toMatch(/^#[a-z0-9-]+$/)
              expect(expected.alternative.sharedSurfaceIds?.length).toBeGreaterThanOrEqual(2)
              expect(expected.alternative.sharedSurfaceIds).toContain(expected.id)
            }
          }
        }
      }
    }
  })

  it('uses surface-specific feature declarations instead of generic profile claims', () => {
    const unitEconomics =
      STORY_174_3_SURFACE_CONTRACTS['/analytics/unit-economics'].table.surfaces[0]!
    expect(unitEconomics.features.sorting.disposition).toBe('executed')
    expect(unitEconomics.features.sorting.rationale).toContain('/analytics/unit-economics')
    expect(unitEconomics.features.pagination.disposition).toBe('not-applicable')
    expect(unitEconomics.features.pagination.rationale).toContain('page-size threshold')

    expect(
      Object.entries(STORY_174_3_SURFACE_CONTRACTS)
        .flatMap(([route, contract]) =>
          contract.table.surfaces
            .filter(surface => surface.features.pagination.disposition === 'executed')
            .map(surface => `${route}:${surface.id}`)
        )
        .sort()
    ).toEqual([
      '/analytics/advertising:advertising-metrics',
      '/analytics/buyout:buyout-products',
      '/analytics/funnel:funnel-days',
      '/analytics/returns:returns-by-sku',
      '/analytics/supply-planning:supply-planning-skus',
      '/orders:fbs-orders',
      '/supplies:supplies',
    ])

    const chart = STORY_174_3_SURFACE_CONTRACTS['/analytics/orders'].chart.surfaces[0]!
    expect(chart.features.title.disposition).toBe('executed')
    expect(chart.features['responsive-containment'].disposition).toBe('executed')
    expect(chart.features['reduced-motion'].disposition).toBe('executed')
    expect(chart.features['exact-data-alternative'].disposition).toBe('executed')
    expect(chart.features['period-and-units'].disposition).toBe('executed')
    expect(chart.features['series-or-legend-meaning'].disposition).toBe('executed')
    expect(chart.features['tooltip-precision'].disposition).toBe('executed')

    const pointInTimeChart =
      STORY_174_3_SURFACE_CONTRACTS['/analytics/unit-economics'].chart.surfaces[0]!
    expect(pointInTimeChart.features['period-and-units'].disposition).toBe('not-applicable')
    expect(pointInTimeChart.features['period-and-units'].rationale).toContain('point-in-time')
    expect(pointInTimeChart.features['series-or-legend-meaning'].disposition).toBe('executed')
    expect(pointInTimeChart.features['tooltip-precision'].disposition).toBe('executed')

    const fixture = readFileSync('e2e/fixtures/story-174-3/table-inventory.ts', 'utf8')
    expect(fixture).not.toContain("profile: 'sortable'")
    expect(fixture).not.toContain("profile: 'actionable'")

    const featureRationales = Object.values(STORY_174_3_SURFACE_CONTRACTS).flatMap(contract =>
      [
        ...contract.table.surfaces,
        ...contract.table.conditionalSurfaces.map(conditional => conditional.item),
        ...contract.chart.surfaces,
        ...contract.chart.conditionalSurfaces.map(conditional => conditional.item),
      ].flatMap(surface => Object.values(surface.features).map(feature => feature.rationale))
    )
    expect(featureRationales).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('not claimed without a surface-specific executable expectation'),
      ])
    )

    const sharedLiquidityAlternatives = STORY_174_3_SURFACE_CONTRACTS[
      '/analytics/liquidity'
    ].chart.surfaces.filter(
      surface => surface.alternative.association === 'shared-complete-data-table'
    )
    expect(sharedLiquidityAlternatives.map(surface => surface.id).sort()).toEqual([
      'liquidity-distribution-trend',
      'liquidity-trend',
    ])
    expect(
      new Set(sharedLiquidityAlternatives.map(surface => surface.alternative.selector))
    ).toEqual(new Set(['#liquidity-trend-complete-data']))
    expect(
      new Set(sharedLiquidityAlternatives.map(surface => surface.alternative.accessibleName))
    ).toEqual(new Set(['Динамика ликвидности по дням']))
    for (const surface of sharedLiquidityAlternatives) {
      expect(surface.alternative.sharedSurfaceIds).toEqual([
        'liquidity-trend',
        'liquidity-distribution-trend',
      ])
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
    const runner = readFileSync('e2e/support/story-174-3-runner-interactions.ts', 'utf8')
    expect(runner).toContain(':not([aria-hidden="true"])')
    expect(runner).toContain(':not([type="hidden"])')
    expect(runner).toContain(':not([tabindex="-1"])')
    expect(runner).not.toContain(', [tabindex]:visible')
    expect(runner).not.toContain('routeOwnedControlCount === 0')
    expect(runner).toContain('routeSurface.locator')
    expect(runner).toContain('overlay receives keyboard focus')
    expect(runner).toContain("page.locator('main:visible').first()")
    expect(runner).toContain("!node.closest('header, nav, aside, [data-sidebar]')")
    expect(runner).not.toContain('dedicatedBrowserGap')
  })
})
