/**
 * Story 170.7 route presentation source contracts (guard canon 169.11/169.12,
 * import.meta.url cwd-safe; regexes single-escaped — NO double-escaping).
 *
 * Pins:
 * - recursive production catalog with an exact-array pin (172.10 canon; both
 *   __tests__ dirs — route-level and components-level — excluded; 170.1
 *   stray-test lesson);
 * - no legacy Tailwind palette utilities in production sources;
 * - no raw CSS hex literals (contextual guard);
 * - chart-token SINGLE-SOURCE: both chart configs derive from
 *   search-chart-config.ts (the 2 pre-migration duplicated configs unified);
 * - e2e-locked labels preserved (by-query input aria-label «Поисковый запрос»,
 *   h1 «Поисковая аналитика»);
 * - sr-only chart alternatives preserved (orders + position charts).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SEARCH_CHART_TOKENS } from '../search-chart-config'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Recursive production catalog (169.11 F4 canon): nested dirs cannot escape. */
function productionFiles(): string[] {
  const all = readdirSync(routeDirectory, { recursive: true }).map(file =>
    join(routeDirectory, file as string)
  )
  return all
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .filter(file => !file.includes('__tests__'))
    .filter(file => !/\.(?:test|spec)\./.test(file))
    .sort()
}

// 169.11 regex canon (letter-lookahead #197-exempt): hex must be quoted or in a
// Tailwind arbitrary-value bracket.
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone)-\d{2,3}\b/

describe('Story 170.7 route presentation source contracts', () => {
  it('productionFiles() recursively enumerates exactly the pinned owned file set', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove must
    // FAIL this pin (upgrades the former count + contains assertions). Catalog
    // derivation (Story 170.7): 22 pre-migration production files, plus
    // SearchPositionOpportunitiesTable.tsx (movers split) and
    // search-chart-config.ts (chart-token single source) = 24.
    const relative = productionFiles()
      .map(f => f.slice(routeDirectory.length + 1).replace(/\\/g, '/'))
      .sort()
    expect(relative).toEqual([
      'components/ChartShell.tsx',
      'components/PositionHistoryChart.tsx',
      'components/ProductCombobox.tsx',
      'components/SearchByProductTab.tsx',
      'components/SearchByProductTable.tsx',
      'components/SearchByQueryTab.tsx',
      'components/SearchByQueryTable.tsx',
      'components/SearchOrdersChart.tsx',
      'components/SearchOrdersOverview.tsx',
      'components/SearchOrdersTab.tsx',
      'components/SearchOrdersTable.tsx',
      'components/SearchPageContent.tsx',
      'components/SearchPositionMoversTable.tsx',
      'components/SearchPositionOpportunitiesTable.tsx',
      'components/SearchPositionSummaryCards.tsx',
      'components/SearchPositionTrendsTab.tsx',
      'components/SearchSellerBadge.tsx',
      'components/SearchShareCard.tsx',
      'components/SortButton.tsx',
      'components/TopKeywordsByOrdersCard.tsx',
      'components/position-history-helpers.tsx',
      'components/search-chart-config.ts',
      'components/search-comparison-utils.ts',
      'page.tsx',
    ])
    // Anchor-safe negative (relative paths cannot collide with a worktree name).
    expect(relative.every(f => !f.includes('__tests__') && !/\.(?:test|spec)\./.test(f))).toBe(true)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('owned production sources contain no raw CSS hex literals (contextual guard)', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('hex guard self-test: rejects quoted hex, ignores ticket prose #197', () => {
    expect(CONTEXTUAL_HEX.test("fill: '#333'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('// see request #197 for the tracking bug')).toBe(false)
  })

  it('chart tokens are single-sourced in search-chart-config (both charts derive from it)', () => {
    expect(SEARCH_CHART_TOKENS).toEqual({
      line: 'var(--color-chart-1)',
      grid: 'var(--color-border)',
      tick: 'var(--color-chart-axis)',
    })
    const ordersChart = readFileSync(join(componentsDirectory, 'SearchOrdersChart.tsx'), 'utf8')
    const helpers = readFileSync(join(componentsDirectory, 'position-history-helpers.tsx'), 'utf8')
    expect(ordersChart).toContain("from './search-chart-config'")
    expect(ordersChart).not.toMatch(/#[0-9A-Fa-f]{6}/)
    expect(helpers).toContain('SEARCH_CHART_TOKENS.line')
    expect(helpers).toContain('SEARCH_CHART_TOKENS.grid')
    expect(helpers).toContain('SEARCH_CHART_TOKENS.tick')
  })

  it('e2e-locked labels preserved: by-query input aria-label and h1 heading', () => {
    const byQueryTab = readFileSync(join(componentsDirectory, 'SearchByQueryTab.tsx'), 'utf8')
    // 170.7 label revert (validator verdict): e2e search-analytics.spec.ts
    // getByLabel('Поисковый запрос') at :139/:219.
    expect(byQueryTab).toContain('aria-label="Поисковый запрос"')
    expect(byQueryTab).not.toContain('aria-label="Поиск по запросам"')
    const pageContent = readFileSync(join(componentsDirectory, 'SearchPageContent.tsx'), 'utf8')
    expect(pageContent).toContain('Поисковая аналитика</h1>')
  })

  it('sr-only chart alternatives preserved (orders + position history)', () => {
    const ordersChart = readFileSync(join(componentsDirectory, 'SearchOrdersChart.tsx'), 'utf8')
    const positionChart = readFileSync(
      join(componentsDirectory, 'PositionHistoryChart.tsx'),
      'utf8'
    )
    expect(ordersChart).toContain('className="sr-only"')
    expect(ordersChart).toContain('role="img"')
    expect(ordersChart).toContain('aria-label={`${TITLE}: ${dayCountLabel}`}')
    expect(ordersChart).toContain('aria-describedby={SEARCH_ORDERS_CHART_DATA_TABLE_ID}')
    expect(positionChart).toContain('className="sr-only"')
    expect(positionChart).toContain('role="img"')
  })
})
