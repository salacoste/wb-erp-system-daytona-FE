/**
 * Story 172.1 micro-guards — dashboard widget tree (owned surface ONLY:
 * src/components/custom/dashboard/** production files; the route tree has its
 * own dashboard-presentation-source-contracts guard). Catalog is NOT
 * count-pinned (146 files is too brittle for piecemeal widget additions) —
 * instead: minimum-size sanity + key-file self-checks + full no-palette/no-hex
 * scan over the whole catalog + semantic token pins (valence, chart vars,
 * brand primary, storage accent, dark tooltips). 169.11 regex canon
 * (contextual, prose-exempt hex); anchor-safe relative-first enumeration
 * (171.8 lesson).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const widgetsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function productionFiles(): string[] {
  return (
    readdirSync(widgetsDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8 lesson): filter RELATIVE entries BEFORE join — substring
      // filters on joined absolute paths also match the checkout/worktree name.
      .filter(f => !f.includes('__tests__'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(widgetsDirectory, f))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.1 widget-tree presentation source contracts', () => {
  it('production catalog sanity (>=140 files, key anchors present)', () => {
    const files = productionFiles()
    expect(files.length).toBeGreaterThanOrEqual(140)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith('BaseMetricCard.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('DeltaIndicator.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('chart-config.ts'))).toBe(true)
    expect(files.some(f => f.endsWith('trends-config.ts'))).toBe(true)
    expect(files.some(f => f.endsWith('expense-chart-config.ts'))).toBe(true)
    expect(files.some(f => f.endsWith('ViewToggle.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('DailyMetricsTableRow.tsx'))).toBe(true)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("fill: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #155 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('valence pin: DeltaIndicator directions use semantic status tokens', () => {
    const delta = readFileSync(join(widgetsDirectory, 'DeltaIndicator.tsx'), 'utf8')
    expect(delta).toMatch(/DIRECTION_STYLES[\s\S]*status-success/)
    expect(delta).toMatch(/DIRECTION_STYLES[\s\S]*status-error/)
    expect(delta).toMatch(/bg-muted/)
  })

  it('chart-config pin: series palettes are theme CSS variables (171.4 canon)', () => {
    const chart = readFileSync(join(widgetsDirectory, 'chart-config.ts'), 'utf8')
    expect(chart).toMatch(/var\(--color-chart-1\)/)
    // Profit is a SIGNED series beside sales by default: primary (legacy
    // brand-red). chart-positive is byte-identical to chart-4 in the light
    // theme and would collide with the sales line (review pass-1 finding).
    expect(chart).toMatch(/profit:\s*'var\(--color-primary\)'/)
    const seriesTokens = [...chart.matchAll(/:\s*'(var\(--color-[a-z0-9-]+\))'/g)].map(m => m[1])
    expect(seriesTokens).toHaveLength(8)
    // pairwise-distinct EXCEPT the two COGS series, which share chart-5 by
    // legacy-hue design (disclosed in chart-config.ts)
    expect(new Set(seriesTokens).size).toBe(7)
    expect(seriesTokens.filter(t => t === 'var(--color-chart-5)')).toHaveLength(2)
    const trends = readFileSync(join(widgetsDirectory, 'trends-config.ts'), 'utf8')
    expect(trends).toMatch(/var\(--color-chart-1\)/)
    expect(trends).toMatch(/var\(--color-chart-2\)/)
    expect(trends).toMatch(/var\(--color-chart-negative\)/)
    const expense = readFileSync(join(widgetsDirectory, 'expense-chart-config.ts'), 'utf8')
    expect(expense).toMatch(/var\(--color-chart-\d\)/)
  })

  it('chart-axis pin: DailyBreakdownChart grid/ticks on chart tokens', () => {
    const daily = readFileSync(join(widgetsDirectory, 'DailyBreakdownChart.tsx'), 'utf8')
    expect(daily).toMatch(/var\(--color-chart-grid\)/)
    expect(daily).toMatch(/var\(--color-chart-axis\)/)
  })

  it('brand pin: ViewToggle active state uses primary tokens', () => {
    const toggle = readFileSync(join(widgetsDirectory, 'ViewToggle.tsx'), 'utf8')
    expect(toggle).toMatch(/bg-primary\b/)
    expect(toggle).toMatch(/text-primary-foreground/)
    expect(toggle).not.toMatch(/ring-\[/)
  })

  it('storage-accent pin: storage series/icons pair on chart-2 (StorageTrendsChart + StorageMetricCard)', () => {
    const trends = readFileSync(join(widgetsDirectory, 'StorageTrendsChart.tsx'), 'utf8')
    expect(trends).toMatch(/var\(--color-chart-2\)/)
    const metric = readFileSync(join(widgetsDirectory, 'StorageMetricCard.tsx'), 'utf8')
    expect(metric).toMatch(/text-chart-2/)
  })

  it('dark-tooltip pin: tooltip panels use chart-tooltip tokens, not fixed darks', () => {
    const turnover = readFileSync(join(widgetsDirectory, 'TurnoverTooltip.tsx'), 'utf8')
    expect(turnover).toMatch(/var\(--color-chart-tooltip\)/)
    expect(turnover).toMatch(/var\(--color-chart-tooltip-foreground\)/)
    const subcategory = readFileSync(join(widgetsDirectory, 'SubcategoryTooltip.tsx'), 'utf8')
    expect(subcategory).toMatch(/var\(--color-chart-tooltip\)/)
  })

  it('tabular-nums pin: numeric surfaces align digits (hero + price-level table)', () => {
    const hero = readFileSync(join(widgetsDirectory, 'DashboardHero.tsx'), 'utf8')
    expect(hero).toMatch(/tabular-nums/)
    const priceLevels = readFileSync(join(widgetsDirectory, 'SalesByPriceLevelCard.tsx'), 'utf8')
    expect(priceLevels).toMatch(/tabular-nums/)
  })
})
