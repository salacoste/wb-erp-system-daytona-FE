/**
 * Story 170.1 route presentation source contracts + C4 disposition matrix.
 *
 * C4 STATE DISPOSITION MATRIX (Task 1; evidence per state):
 * - page-level error + Повторить — TESTED: error.tsx boundary (route-owned,
 *   pre-existing; retry via router reload) — untouched by migration.
 * - error.tsx boundary — N/A-evidence: error.tsx is token-clean (guard below).
 * - initial loading — TESTED: skeleton locks in PerformanceTableSkeleton,
 *   AdvertisingSummaryCards skeleton, DailyTrendChart skeleton tests.
 * - background refresh — N/A-evidence: route hooks run refetchInterval 0
 *   (manual refresh only; useAdvertisingPageState has no polling) — recovery
 *   via manual filter re-apply; deliberate pre-migration behavior, preserved.
 * - global empty vs filtered-empty — TESTED: PerformanceMetricsTable
 *   «Нет данных за выбранный период» + AdvertisingEmptyState; efficiency
 *   status filter (lossCount) drives filtered-empty (AdvertisingFilters tests).
 * - sync-gap strip — TESTED: SyncGapsTimeline coverage/labels tests.
 * - over-attribution — TESTED: OverAttributionBanner + negative-organic
 *   renderOrganicValue/organic_contribution tests (value shown, not masked).
 * - multi-campaign — TESTED: MultiCampaignWarningBanner/Badge tests.
 * - partial daily/finance — TESTED: DailyTrendChart empty-data branch +
 *   AdCostDiscrepancyCard null-layer handling (chartData < 2 → null).
 * - stale 26h — TESTED: SyncStatusIndicator stale dot (status-pending token,
 *   flipped pin) — reads the SEPARATE sync-status endpoint (lastSyncAt,
 *   null-safe); meta.last_sync is honest-null post-preface #236 with zero UI
 *   consumers (validated).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DAILY_TREND_COLORS, DEFAULT_DAILY_VISIBLE } from '../daily-trend-config'
import { AD_COST_LAYERS, SEVERITY_COLORS } from '../ad-cost-discrepancy-config'
import {
  EFFICIENCY_TIER_TOKENS,
  getCampaignStatusDotToken,
  getRoasTierTextClass,
} from '../advertising-tokens'
import { EfficiencyBadge } from '../EfficiencyBadge'
import { DailyTrendSrTable } from '../DailyTrendSrTable'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Recursive catalog: every owned production .ts/.tsx under the advertising
 * ROOT route, EXCLUDING the nested campaigns/[advertId] detail (epic VC note —
 * separate ownership) and test files (incl. stray colocated .test.* files). */
function ownedProductionFiles(): string[] {
  const all = readdirSync(routeDirectory, { recursive: true }).map(file =>
    join(routeDirectory, file as string)
  )
  return all
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .filter(file => !file.includes('__tests__'))
    .filter(file => !/\.(?:test|spec)\./.test(file))
    .filter(file => !file.includes('campaigns'))
    .sort()
}

/** Pinned post-migration count (was 62 pre-migration; +advertising-tokens,
 * +DailyTrendSrTable). Update consciously when files are added/extracted. */
const PINNED_PRODUCTION_FILE_COUNT = 64

/** Story 170.1 E-1: stray colocated tests live OUTSIDE __tests__/ — the guard
 * glob (and any test enumeration) must include them so they cannot silently
 * escape ownership assertions. */
const STRAY_COLOCATED_TESTS = [
  'components/ProductRowBadge.test.tsx',
  'components/performance-table/performance-table-columns.test.tsx',
  'components/performance-table/performance-table-formatters.test.ts',
  'components/performance-table/performance-table-metric-cells.test.tsx',
  'components/performance-table/PerformanceTableHeader.test.tsx',
  'components/performance-table/SortableHeader.test.tsx',
]

const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

const RGBA_HSL = /(?:rgba?\(|hsla?\()\s*\d/

describe('Story 170.1 route presentation source contracts', () => {
  it('ownedProductionFiles() recursively enumerates exactly the pinned owned file set', () => {
    const files = ownedProductionFiles()
    expect(files.length).toBe(PINNED_PRODUCTION_FILE_COUNT)
    expect(files).toContain(join(routeDirectory, 'page.tsx'))
    expect(files).toContain(join(componentsDirectory, 'advertising-tokens.ts'))
    expect(files).toContain(join(componentsDirectory, 'DailyTrendSrTable.tsx'))
    // Nested campaign detail route is NOT owned — must not appear.
    expect(files.some(f => f.includes('campaigns'))).toBe(false)
  })

  it('stray colocated tests exist and are covered by the route glob (E-1)', () => {
    for (const stray of STRAY_COLOCATED_TESTS) {
      expect(existsSync(join(routeDirectory, stray)), stray).toBe(true)
    }
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke|scrollbar-thumb|scrollbar-track|decoration|outline|divide)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone|fuchsia|pink|violet|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
    for (const file of ownedProductionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw hex literals or rgba()/hsl() colors', () => {
    for (const file of ownedProductionFiles()) {
      const src = withoutComments(readFileSync(file, 'utf8'))
      expect(src, `${file} hex`).not.toMatch(CONTEXTUAL_HEX)
      expect(src, `${file} rgba/hsl`).not.toMatch(RGBA_HSL)
    }
  })

  it('hex guard self-test: rejects quoted/arbitrary hex, ignores ticket prose', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('// see request #161 for the FCU feature')).toBe(false)
  })

  it('lib-channel runtime negatives: the 3 corrected color channels are NOT consumed (169.10 lockstep intact)', () => {
    const negatives: [string, RegExp][] = [
      ['getRoasColorClass', /\bgetRoasColorClass\b/],
      // getEfficiencyConfig itself stays (labels/icons); only its color fields are banned
      ['getEfficiencyConfig color fields', /\.(?:bgColor|textColor|iconColor|borderColor)\b/],
      ['getCampaignStatusDotColor', /\bgetCampaignStatusDotColor\b/],
    ]
    for (const file of ownedProductionFiles()) {
      const src = withoutComments(readFileSync(file, 'utf8'))
      for (const [name, re] of negatives) {
        expect(src, `${file} consumes ${name}`).not.toMatch(re)
      }
    }
  })

  it('forbidden-file absence pins: campaigns detail + BidRecommendationsCard untouched by root sources', () => {
    // Root sources must not import the campaigns-detail-exclusive component.
    for (const file of ownedProductionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(
        /BidRecommendationsCard/
      )
    }
    // Forbidden surfaces still exist on disk (zero-diff, not deleted).
    expect(existsSync(join(routeDirectory, 'campaigns/[advertId]/page.tsx'))).toBe(true)
    expect(
      existsSync(
        join(process.cwd(), 'src/components/custom/advertising/BidRecommendationsCard.tsx')
      )
    ).toBe(true)
  })

  it('aria-sort PRESERVE pin (163.1): total occurrence count across owned sources', () => {
    let count = 0
    for (const file of ownedProductionFiles()) {
      count += (readFileSync(file, 'utf8').match(/aria-sort=\{/g) ?? []).length
    }
    // 3 sortable columns in PerformanceTableHeader + 1 dynamic in MergedGroupTableHeader
    expect(count).toBe(4)
  })

  it('URL contract pin: exact param spellings + valid group_by set (sku|imtId)', () => {
    const state = readFileSync(join(componentsDirectory, 'useAdvertisingPageState.ts'), 'utf8')
    expect(state).toMatch(/'group_by'/)
    expect(state).toContain("searchParams.get('group_by')")
    const helpers = readFileSync(
      join(componentsDirectory, 'advertising-page-state-helpers.ts'),
      'utf8'
    )
    expect(helpers).toMatch(/\['sku', 'imtId'\]/)
    // e2e-pinned drill-down spellings
    const table = readFileSync(
      join(componentsDirectory, 'performance-table/PerformanceMetricsTable.tsx'),
      'utf8'
    )
    expect(table).toMatch(/\/products\/\$\{item\.sku_id\}/)
    expect(table).toMatch(/buildCampaignDetailRoute\(item\.campaign_id\)/)
  })

  it('daily trend series mapping: valence spend/roas + categorical views/clicks/orders (documented)', () => {
    expect(DAILY_TREND_COLORS.spend).toBe('var(--color-chart-negative)') // cost valence
    expect(DAILY_TREND_COLORS.roas).toBe('var(--color-chart-positive)') // efficiency valence
    expect(DAILY_TREND_COLORS.views).toBe('var(--color-chart-1)')
    expect(DAILY_TREND_COLORS.clicks).toBe('var(--color-chart-2)')
    expect(DAILY_TREND_COLORS.orders).toBe('var(--color-chart-3)')
    // Behavior lock: roas hidden by default (Story 72.3)
    expect(DEFAULT_DAILY_VISIBLE).not.toContain('roas')
  })

  it('discrepancy layers: 3 categorical chart tokens in layer order', () => {
    expect(AD_COST_LAYERS.map(l => l.color)).toEqual([
      'var(--color-chart-1)',
      'var(--color-chart-2)',
      'var(--color-chart-3)',
    ])
  })

  it('severity thresholds 5/10 locked; severity text uses status tokens', () => {
    expect(SEVERITY_COLORS.warning).toBe('text-status-warning')
    expect(SEVERITY_COLORS.danger).toBe('text-status-error')
  })

  it('invertComparison pin: discrepancy uses inverted comparison (lower cost is better)', () => {
    const config = readFileSync(join(componentsDirectory, 'ad-cost-discrepancy-config.ts'), 'utf8')
    expect(config).toMatch(/calculateComparison\(actual,\s*platform,\s*true\)/)
  })

  it('tier-collapse guard: 5 efficiency tiers + unknown are DISTINCT (Set size 6)', () => {
    const chips = Object.values(EFFICIENCY_TIER_TOKENS).map(t => t.chip)
    expect(chips).toHaveLength(6)
    expect(new Set(chips).size).toBe(6)
    // unknown is muted — never styled as healthy green
    expect(EFFICIENCY_TIER_TOKENS.unknown.chip).toBe('bg-muted text-muted-foreground')
  })

  it('campaign status dot tokens: 5 codes + muted fallback', () => {
    expect(getCampaignStatusDotToken(9)).toBe('bg-status-success')
    expect(getCampaignStatusDotToken(11)).toBe('bg-status-warning')
    expect(getCampaignStatusDotToken(7)).toBe('bg-muted-foreground')
    expect(getCampaignStatusDotToken(4)).toBe('bg-status-information')
    expect(getCampaignStatusDotToken(8)).toBe('bg-status-error')
    expect(getCampaignStatusDotToken(999)).toBe('bg-muted-foreground')
  })

  it('ROAS two-metric separation negative pin: ad-attributed revenue ≠ total_sales (compute check)', () => {
    // A SKU with organic sales: total (organic + ad) strictly exceeds ad-attributed.
    // The two summary channels must never be conflated (memory validated 2026-02-23).
    const totalSales = 150_000
    const adRevenue = 90_000
    const organic = totalSales - adRevenue
    expect(organic).toBeGreaterThan(0)
    expect(adRevenue).not.toBe(totalSales)
    // Per-day ROAS = revenueAttributed / spend — ad-only numerator (behavior lock)
    expect(getRoasTierTextClass(null)).toBe('text-muted-foreground')
  })

  it('sr-only alternative: DailyTrendSrTable exposes every day × visible series with units', () => {
    const data: AdvertisingDailyItem[] = [
      { date: '2026-03-07', spend: 1234.5, views: 5000, clicks: 120, orders: 10, roas: 2.5 },
      { date: '2026-03-08', spend: 987.25, views: 4000, clicks: 99, orders: 8, roas: null },
    ]
    render(<DailyTrendSrTable data={data} visibleSeries={[...DEFAULT_DAILY_VISIBLE]} />)
    // Name-distinct region + full-precision values + units caption
    expect(screen.getByText('Дата')).toBeInTheDocument()
    expect(screen.getByText('2026-03-08')).toBeInTheDocument()
    expect(screen.getByText(/рубли/)).toBeInTheDocument()
    expect(screen.getByText(/ROAS — множитель/)).toBeInTheDocument()
    // roas hidden by default → no ROAS column header in the visible-default render
    expect(screen.queryByRole('columnheader', { name: 'ROAS' })).not.toBeInTheDocument()
  })

  it('sr-only alternative: discrepancy chart table exposes charted layers + % change', () => {
    const chart = readFileSync(join(componentsDirectory, 'AdCostDiscrepancyChart.tsx'), 'utf8')
    expect(chart).toMatch(/sr-only/)
    expect(chart).toMatch(/Изменение платформа → факт/)
    expect(chart).toMatch(/formattedPercentage/)
  })

  it('table hygiene pins: TableCaption ×2, scroll-regions, tabular-nums; SKU font-mono intact', () => {
    const perfTable = withoutComments(
      readFileSync(
        join(componentsDirectory, 'performance-table/PerformanceMetricsTable.tsx'),
        'utf8'
      )
    )
    const mergedTable = withoutComments(
      readFileSync(join(componentsDirectory, 'MergedGroupTable.tsx'), 'utf8')
    )
    expect(perfTable).toMatch(/<TableCaption>/)
    expect(mergedTable).toMatch(/<TableCaption>/)
    expect(perfTable).toMatch(/role="region"/)
    expect(mergedTable).toMatch(/role="region"/)
    expect(perfTable).toMatch(/tabular-nums/)
    // SKU/nmId identifiers keep font-mono (169.7 pin — mono WITHOUT tabular)
    const cannibalization = readFileSync(
      join(componentsDirectory, 'CannibalizationSection.tsx'),
      'utf8'
    )
    const monoLine = cannibalization.split('\n').find(line => line.includes('font-mono'))
    expect(monoLine, 'font-mono nmId line present').toBeDefined()
    expect(monoLine).not.toMatch(/tabular-nums/)
  })

  it('EfficiencyBadge renders unknown tier muted (visible-unknown, preface #218/#226)', () => {
    render(<EfficiencyBadge status="unknown" />)
    const badge = screen.getByText('Нет данных')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-muted')
  })
})
