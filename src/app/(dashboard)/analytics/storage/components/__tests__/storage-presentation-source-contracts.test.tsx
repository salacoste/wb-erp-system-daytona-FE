/**
 * Story 169.12 route presentation source contracts + C4 disposition matrix.
 *
 * C4 / IMPORT STATE DISPOSITION MATRIX (Story 169.12 Task 1; evidence per state):
 * - route loading — TESTED: loading.tsx skeleton parity (token-clean, pinned
 *   below); per-component skeleton tests (SKU table/chart/widget/cards).
 * - page error (bySku) — TESTED: StoragePage.test.tsx error-state describe.
 * - per-section trends/topConsumers error — TESTED (Story 169.12 ADD; these
 *   hooks silently dropped errors pre-migration): StoragePage.test.tsx
 *   per-section describe — recoverable Alert per section, other sections retain
 *   their data (AC-2).
 * - global empty (has_data=false) — TESTED: StoragePage no-data describe +
 *   StorageNoDataContent filters-retained view.
 * - filtered-empty — TESTED: StorageBySkuTable «Ничего не найдено» vs global
 *   «Нет товаров с данными о хранении» distinction (existing suite).
 * - chart empty — TESTED: StorageTrendsChart «Нет данных за выбранный период».
 * - week-filter mismatch (W-labels) — TESTED: WeekFilterBadge suite (existing).
 * - alert threshold 20 + null-ratio-as-0 DISPLAY-GUARD — TESTED:
 *   StorageAlertBanner suite (existing; threshold semantics untouched).
 * - import idle/processing/success/failure — TESTED: PaidStorageImportDialog
 *   suite + PaidStorageImportStatus.test.tsx (4-state distinctness, focusable
 *   bounded live summaries).
 * - import close-during-processing confirm — TESTED: dialog suite (existing).
 * - unknown import status — TESTED (Task 0 merged): neutral muted hint «Статус
 *   импорта неизвестен», NOT error-red (PaidStorageImportStatus.test.tsx);
 *   poll keeps running (useStorageImport disposition, read-only contract).
 * - uploading/partial import states — N/A-backend-absent: WB paid-storage
 *   import endpoint exposes no uploading/partial lifecycle states (single
 *   POST → poll completed/failed); verified against the route's own import
 *   contract (useStorageImport + ImportStatusResponse union, read-only).
 *   AC-2 wording deviation from the epic's literal uploading/partial list is
 *   FLAGGED for reviewer sign-off in the story Gaps.
 * - stale — N/A-read-only: storage hooks expose no staleness indicator and the
 *   route has no staleness UI pre-migration (source: src/hooks/useStorage*
 *   read-only).
 * - background refresh retention — TESTED: data-present branch renders while
 *   isLoading=false; content swaps on refetch without skeleton flash
 *   (structural retention via TanStack, 169.11 precedent).
 * - tri-state has_warehouse_stock — TESTED: null → «—», false → «Нет на
 *   складе», true → nothing (SKU table + widget describes).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CHART_COLORS } from '../storage-trends-config'
import { formatCurrency, formatWeekShort } from '../storage-format'

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

/**
 * Pinned post-migration count (Story 169.12): 26 legacy production files,
 * minus dead ProductNameCell.tsx, plus storage-format.ts and
 * StorageTrendSrTable.tsx = 27. Update consciously when files are
 * added/extracted/deleted.
 */
const PINNED_PRODUCTION_FILE_COUNT = 27

// Story 169.11 regex canon (letter-lookahead #197-exempt): a hex literal must
// be quoted or in a Tailwind arbitrary-value bracket.
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone)-\d{2,3}\b/

describe('Story 169.12 route presentation source contracts', () => {
  it('productionFiles() recursively enumerates exactly the pinned owned file set', () => {
    const files = productionFiles()
    expect(files.length).toBe(PINNED_PRODUCTION_FILE_COUNT)
    expect(files).toContain(join(routeDirectory, 'page.tsx'))
    expect(files).toContain(join(routeDirectory, 'loading.tsx'))
    expect(files).toContain(join(componentsDirectory, 'storage-format.ts'))
    expect(files).toContain(join(componentsDirectory, 'StorageTrendSrTable.tsx'))
    // Dead code removed (Story 169.12)
    expect(files.some(f => f.endsWith('ProductNameCell.tsx'))).toBe(false)
    expect(files.some(f => f.includes('__tests__') || /\.(?:test|spec)\./.test(f))).toBe(false)
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

  it('hex guard rejects quoted #333 / #7C4DFF and arbitrary-value hex, ignores ticket prose #197', () => {
    expect(CONTEXTUAL_HEX.test("fill: '#333'")).toBe(true)
    expect(CONTEXTUAL_HEX.test("storage: '#7C4DFF'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('// see request #197 for the tracking bug')).toBe(false)
    expect(CONTEXTUAL_HEX.test('запрос #197 закрыт')).toBe(false)
  })

  it('chart series colors are registered var() tokens; selected emphasis is negative valence', () => {
    expect(CHART_COLORS.storage).toBe('var(--color-chart-1)')
    expect(CHART_COLORS.selected).toBe('var(--color-chart-negative)')
    // Gradient stops deleted along with the hex channel
    expect('gradientStart' in CHART_COLORS).toBe(false)
    expect('gradientEnd' in CHART_COLORS).toBe(false)
  })

  it('trend axes/grid use the canonical border var; CustomDot keeps pointer cursor', () => {
    const chart = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendsChart.tsx'), 'utf8')
    )
    expect(chart).toMatch(/var\(--color-border\)/)
    expect(chart).not.toMatch(/hsl\(var\(--border\)\)/)
    const parts = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendsChartParts.tsx'), 'utf8')
    )
    expect(parts).toMatch(/cursor: 'pointer'/)
    expect(parts).toMatch(/stroke="var\(--color-background\)"/)
  })

  it('tooltip uses the popover canon (bg-popover + popover-foreground + shadow-lg, no bg-background)', () => {
    const parts = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendsChartParts.tsx'), 'utf8')
    )
    expect(parts).toMatch(/bg-popover/)
    expect(parts).toMatch(/text-popover-foreground/)
    expect(parts).toMatch(/shadow-lg/)
    expect(parts).not.toMatch(/bg-background/)
    // Inline hex style channel killed — value color is a class token now
    expect(parts).not.toMatch(/style=\{\{ color: CHART_COLORS/)
  })

  it('TrendBadge uses financial-positive/negative /15 matched pairs; manual "+" sign preserved', () => {
    const parts = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendsChartParts.tsx'), 'utf8')
    )
    expect(parts).toMatch(/text-financial-negative bg-financial-negative\/15/)
    expect(parts).toMatch(/text-financial-positive bg-financial-positive\/15/)
    expect(parts).toMatch(/text-muted-foreground bg-muted/)
    // Sign contract lock (do NOT enable signDisplay)
    expect(parts).toMatch(/\{isPositive \? '\+' : ''\}/)
    expect(parts).not.toMatch(/signDisplay/)
  })

  it('alert banner uses the status-error /15 + /30 matched pair; legend dots are status tokens', () => {
    const banner = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageAlertBanner.tsx'), 'utf8')
    )
    expect(banner).toMatch(/bg-status-error\/15/)
    expect(banner).toMatch(/border-status-error\/30/)
    expect(banner).toMatch(/text-status-error/)
    expect(banner).toMatch(/bg-status-success/)
    expect(banner).toMatch(/bg-status-warning/)
    expect(banner).not.toMatch(/text-red-800/)
  })

  it('SKU table: aria-sort on 4 sortable headers, static caption, scroll region, tabular-nums', () => {
    const header = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageSkuTableHeader.tsx'), 'utf8')
    )
    expect(header.match(/aria-sort=\{ariaSortValue/g)?.length).toBe(4)
    const table = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageBySkuTable.tsx'), 'utf8')
    )
    expect(table).toMatch(/<TableCaption>/)
    expect(table).toMatch(/role="region"/)
    expect(table).toMatch(/tabular-nums/)
    const monoLine = table.split('\n').find(line => line.includes('font-mono'))
    expect(monoLine).toBeDefined()
    expect(monoLine).not.toMatch(/tabular-nums/)
  })

  it('severity classifier is the shared getStorageRatioSeverity (parked dedupe absorbed)', () => {
    const helpers = withoutComments(
      readFileSync(join(componentsDirectory, 'TopConsumersHelpers.tsx'), 'utf8')
    )
    expect(helpers).toMatch(/getStorageRatioSeverity/)
    expect(helpers).not.toMatch(/function getCostSeverity/)
  })

  it('formatters are single-sourced in storage-format (dedupe ×4 currency, ×2 week)', () => {
    expect(formatCurrency(null)).toBe('—')
    // ru-RU group separator is NBSP (U+00A0)
    expect(formatCurrency(15000)).toMatch(/^15[\s\u00A0]000[\s\u00A0]₽$/)
    expect(formatWeekShort('2026-W09')).toBe('W09')
    for (const name of [
      'StorageSummaryCards.tsx',
      'TopConsumersWidget.tsx',
      'WeekFilterBadge.tsx',
    ]) {
      const source = withoutComments(readFileSync(join(componentsDirectory, name), 'utf8'))
      expect(source, name).toMatch(/from '.\/storage-format'/)
      expect(source, name).not.toMatch(/new Intl\.NumberFormat\('ru-RU', \{\s*style: 'currency'/)
    }
    const utils = withoutComments(
      readFileSync(join(componentsDirectory, 'storage-sku-table-utils.ts'), 'utf8')
    )
    expect(utils).toMatch(/export \{ formatCurrency \} from '.\/storage-format'/)
    const config = withoutComments(
      readFileSync(join(componentsDirectory, 'storage-trends-config.ts'), 'utf8')
    )
    expect(config).not.toMatch(/formatCurrency|formatWeekShort/)
  })

  it('import status views use status-success/error pairs; processing unknown hint is neutral', () => {
    const status = withoutComments(
      readFileSync(join(componentsDirectory, 'PaidStorageImportStatus.tsx'), 'utf8')
    )
    expect(status).toMatch(/text-status-success/)
    expect(status).toMatch(/text-status-error/)
    expect(status).toMatch(/Статус импорта неизвестен/)
    expect(status).toMatch(/role="status"/)
    expect(status).toMatch(/role="alert"/)
  })

  it('sr-only data alternative exists alongside the distinct sr-only table-section heading', () => {
    const sr = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendSrTable.tsx'), 'utf8')
    )
    expect(sr).toMatch(/className="sr-only"/)
    expect(sr).toMatch(/Данные о расходах на платное хранение по неделям/)
    const chart = withoutComments(
      readFileSync(join(componentsDirectory, 'StorageTrendsChart.tsx'), 'utf8')
    )
    expect(chart).toMatch(/StorageTrendSrTable/)
    const section = withoutComments(
      readFileSync(join(componentsDirectory, 'StoragePageTableSection.tsx'), 'utf8')
    )
    // Name-distinct existing sr-only h2 (no duplicate region naming)
    expect(section).toMatch(/Детализация по хранению/)
  })

  it('loading.tsx is token-clean (skeleton + muted only)', () => {
    const loading = withoutComments(readFileSync(join(routeDirectory, 'loading.tsx'), 'utf8'))
    expect(loading).toMatch(/Skeleton/)
    expect(loading).toMatch(/bg-muted\/30/)
    expect(loading).not.toMatch(LEGACY_PALETTE)
  })
})
