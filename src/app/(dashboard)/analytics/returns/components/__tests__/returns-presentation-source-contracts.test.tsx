/**
 * Story 169.11 route presentation source contracts + C4 disposition matrix.
 *
 * C4 STATE DISPOSITION MATRIX (Story 169.11 Task 1; evidence per state):
 * - default success — TESTED: ReturnReasonsPieChart happy path, ReturnsTable
 *   happy path, ReturnsSummaryCards values, ReturnTrendChart populated.
 * - initial structural loading — TESTED: pie/cards/table skeleton tests +
 *   ReturnTrendChart skeleton lock (ReturnTrendChart.test.tsx).
 * - background refresh with retained usable content — TESTED: data-present
 *   branch renders while isLoading=false; content swaps to v2 on refetch
 *   without skeleton flash (structural retention via TanStack).
 * - recoverable error vs retained stale content — DISPOSITION: error Alert
 *   supersedes stale chart by route canon (destructive Alert per section,
 *   matches ReturnsSummaryCards/ReturnsTable/ReturnReasonsPieChart); recovery
 *   via shared hook retry=1; deliberate, not a regression.
 * - global empty (no returns) — TESTED: pie «Нет данных о причинах возвратов»,
 *   cards «Нет данных о возвратах…», table «Нет данных за выбранный период»,
 *   trend «Нет данных о возвратах за выбранный период».
 * - filtered-empty with visible reset — TESTED: ReturnsPageContent checkbox
 *   toggles anomalyOnly and the empty message switches back on uncheck
 *   (ReturnsPageContent.test.tsx) + ReturnsTable anomaly-specific empty test.
 * - recoverable error with retry — TESTED (destructive Alert per section):
 *   pie/cards/table error tests + ReturnTrendChart error≠empty lock. No
 *   route-owned retry button exists pre-migration; TanStack Query retry=1 in
 *   the shared hook is the recovery path (shared surface — read-only).
 * - trend error distinct from trend empty — TESTED: ReturnTrendChart lock.
 * - stale — N/A with evidence: shared hooks (use-returns-daily.ts,
 *   use-return-analytics.ts) expose no staleTime-expired indicator to the
 *   route; no route-owned staleness UI pre-migration (source: hooks, read-only).
 * - partial — TESTED: summary-present/byCategory-empty fixtures (pie empty
 *   state test) + byCategory-present/summary-absent (cards test);
 *   partial-series days are preserved verbatim by the trend chart (AC2 lock
 *   via sr-only every-day table).
 * - permission-restricted — N/A with evidence: route performs no role gating;
 *   backend 403 surfaces through the shared error branches already tested.
 * - processing/success — N/A with evidence: route has no mutations/exports
 *   lifecycle UI; CSV export is a client-side generation (ExportCsvButton,
 *   shared read-only) disabled on empty data.
 * - unknown reason — TESTED (Task 0 merged): neutral «unknown» fixture in
 *   ReturnReasonsPieChart.test.tsx.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReturnRateCell } from '../ReturnsTableHelpers'
import { RETURNS_BAR_SERIES, RETURNS_DAILY_COLORS } from '../returns-daily-trend-config'
import { getDeltaColor, isInvertedMetric } from '../returns-comparison-utils'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Recursive catalog (round-1 review F4): every production .ts/.tsx under the
 * route except __tests__ and .test./.spec. files. Made recursive — the original
 * flat readdirSync let a nested directory silently escape the guard.
 */
function productionFiles(): string[] {
  const all = readdirSync(routeDirectory, {
    recursive: true,
  }).map(file => join(routeDirectory, file as string))
  return all
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .filter(file => !file.includes('__tests__'))
    .filter(file => !/\.(?:test|spec)\./.test(file))
    .sort()
}

/** Pinned post-extraction count — update consciously when files are added/extracted (F4). */
const PINNED_PRODUCTION_FILE_COUNT = 14

// Story 169.11 contextual hex guard: a hex literal must be quoted or in a
// Tailwind arbitrary-value bracket — catches '#333', '#000', '#000000', and
// bg-[#1A2B3C] while ignoring ticket prose such as "запрос #197" (no quote or
// `-[` before the `#`).
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 169.11 route presentation source contracts', () => {
  it('productionFiles() recursively enumerates exactly the pinned owned file set (round-1 review F4)', () => {
    const files = productionFiles()
    // Pinned count — update consciously when files are added/extracted.
    expect(files.length).toBe(PINNED_PRODUCTION_FILE_COUNT)
    // page.tsx + the extracted sr-table are both present; no test files leak in.
    expect(files).toContain(join(routeDirectory, 'page.tsx'))
    expect(files).toContain(join(componentsDirectory, 'ReturnTrendSrTable.tsx'))
    expect(files.some(f => f.includes('__tests__') || /\.(?:test|spec)\./.test(f))).toBe(false)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone)-\d{2,3}\b/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw CSS hex literals (contextual guard)', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('hex guard rejects quoted #333 / #000 / #000000 and arbitrary-value hex, ignores ticket prose #197', () => {
    expect(CONTEXTUAL_HEX.test("fill: '#333'")).toBe(true)
    expect(CONTEXTUAL_HEX.test("stroke: '#000'")).toBe(true)
    expect(CONTEXTUAL_HEX.test("color: '#000000'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    // Ticket prose: `#` preceded by a space/letter, not a quote or arbitrary-value bracket.
    expect(CONTEXTUAL_HEX.test('// see request #197 for the tracking bug')).toBe(false)
    expect(CONTEXTUAL_HEX.test('запрос #197 закрыт')).toBe(false)
  })

  it('chart series colors are registered var() tokens; bars chart-1..3 in stack order, rate line is negative valence', () => {
    expect(RETURNS_BAR_SERIES.map(s => s.key)).toEqual(['cancellations', 'refusals', 'defects'])
    expect(RETURNS_BAR_SERIES[0].color).toBe('var(--color-chart-1)')
    expect(RETURNS_BAR_SERIES[1].color).toBe('var(--color-chart-2)')
    expect(RETURNS_BAR_SERIES[2].color).toBe('var(--color-chart-3)')
    // Valence decision (documented): returnRate higher = worse → chart-negative.
    expect(RETURNS_DAILY_COLORS.returnRate).toBe('var(--color-chart-negative)')
  })

  it('stack-order + single-source pin: legend and tooltip read the shared config, not their own colors', () => {
    const legend = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnTrendChartTooltip.tsx'), 'utf8')
    )
    expect(legend).toMatch(/RETURNS_BAR_SERIES/)
    expect(legend).toMatch(/RETURNS_DAILY_COLORS/)
    expect(legend).not.toMatch(/color:\s*['"]#/)
    const chart = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnTrendChart.tsx'), 'utf8')
    )
    expect(chart).toMatch(/fill=\{series\.color\}/)
    expect(chart).toMatch(/stroke=\{RETURNS_DAILY_COLORS\.returnRate\}/)
  })

  it('tier-collapse guard: 3 distinct status tiers + neutral (Set size)', () => {
    render(
      <>
        <ReturnRateCell rate={0} />
        <ReturnRateCell rate={20} />
        <ReturnRateCell rate={51} />
        <ReturnRateCell rate={null} />
      </>
    )
    const classes = screen
      .getAllByText(/%/)
      .map(el => el.className)
      .concat(screen.getByText('—').className)
    const statusTokens = classes.filter(c => c.includes('text-status-'))
    expect(new Set(statusTokens).size).toBe(3) // success + warning + error
    expect(classes.some(c => c.includes('text-muted-foreground'))).toBe(true) // neutral
  })

  it('inversion negative pin: up on totalReturns (inverted metric) renders financial-negative', () => {
    expect(isInvertedMetric('totalReturns')).toBe(true)
    expect(getDeltaColor('up', isInvertedMetric('totalReturns'))).toBe('text-financial-negative')
    expect(getDeltaColor('down', isInvertedMetric('overallReturnRate'))).toBe(
      'text-financial-positive'
    )
  })

  it('trend axes/grid use semantic tokens; dot fill uses the background var', () => {
    const chart = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnTrendChart.tsx'), 'utf8')
    )
    expect(chart).toMatch(/var\(--color-chart-axis\)/)
    expect(chart).toMatch(/var\(--color-border\)/)
    expect(chart).toMatch(/fill: 'var\(--color-background\)'/)
  })

  it('tooltip uses the popover canon (bg-popover + popover-foreground + shadow-lg)', () => {
    const tooltip = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnTrendChartTooltip.tsx'), 'utf8')
    )
    expect(tooltip).toMatch(/bg-popover/)
    expect(tooltip).toMatch(/text-popover-foreground/)
    expect(tooltip).toMatch(/shadow-lg/)
    expect(tooltip).not.toMatch(/bg-background/)
  })

  it('reason triplet uses status tokens; unknown fallbacks are muted (single-source)', () => {
    const parts = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnReasonsChartParts.tsx'), 'utf8')
    )
    expect(parts).toMatch(/bg-status-information/)
    expect(parts).toMatch(/bg-status-warning/)
    expect(parts).toMatch(/bg-status-error/)
    expect(parts).toMatch(/'bg-muted'/)
    expect(parts).toMatch(/var\(--color-status-information\)/)
    expect(parts).toMatch(/var\(--color-status-warning\)/)
    expect(parts).toMatch(/var\(--color-status-error\)/)
    expect(parts).toMatch(/var\(--color-muted-foreground\)/)
  })

  it('table renders a scroll region + static caption; no aria-sort (no sortable headers — N/A recorded)', () => {
    const table = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnsTable.tsx'), 'utf8')
    )
    expect(table).toMatch(/tabIndex=\{0\}/)
    expect(table).toMatch(/aria-label="Таблица возвратов по SKU/)
    expect(table).toMatch(/<TableCaption>Возвраты по SKU<\/TableCaption>/)
    expect(table).not.toMatch(/aria-sort/)
    // Anomaly row: /15 + /30 matched pair (169.5); nmId mono WITHOUT tabular (169.7 pin)
    const row = readFileSync(join(componentsDirectory, 'ReturnsTableRow.tsx'), 'utf8')
    expect(row).toMatch(/bg-status-error\/15/)
    expect(row).toMatch(/hover:bg-status-error\/30/)
    expect(row).toMatch(/tabular-nums/)
    const monoLine = row.split('\n').find(line => line.includes('font-mono'))
    expect(monoLine, 'font-mono nmId line present').toBeDefined()
    expect(monoLine).not.toMatch(/tabular-nums/)
  })

  it('page header uses the shared PageHeader; checkbox border is border-input', () => {
    const page = withoutComments(
      readFileSync(join(componentsDirectory, 'ReturnsPageContent.tsx'), 'utf8')
    )
    expect(page).toMatch(/PageHeader title="Аналитика возвратов"/)
    expect(page).toMatch(/border-input/)
    expect(page).toMatch(/aria-labelledby="returns-anomaly-label"/)
    expect(page).not.toMatch(/text-gray-900/)
  })
})
