/**
 * Story 170.3-FE brand-margin presentation source contracts.
 *
 * Guard location choice: colocated with MarginByBrandTable.test.tsx (NOT in the
 * brand route __tests__/) — the table is the largest owned surface and lives in
 * src/components/custom, outside the route directory; colocation keeps the guard
 * adjacent to the file it pins most, with explicit paths for the 2 route files.
 *
 * C4 THIN-MATRIX DISPOSITIONS (Task 1 — owned surface is a composition of
 * read-only shared pieces; none of these states are owned here):
 * - missing-COGS banner — SHARED: MarginMissingCogsBanner (analytics/shared),
 *   zero-diff, pinned absent from owned sources below.
 * - storage comparison — SHARED: StorageComparisonCard (analytics/shared), zero-diff.
 * - negative-margin badge — SHARED: MarginBadge inside MarginAggregatedTableRow
 *   (shared with category route = 170.5 surface); owned table only forwards data.
 * - export failure — SHARED: ExportDialog, zero-diff; owned page pins defaultType.
 * - stale/partial expenses — SHARED: calculate-margin-stats (read-only utility).
 * Owned empty-states ×2 BOTH live and intentional (page-null vs table-[] — pinned).
 *
 * LEGACY PIN COUNT: ZERO (validator-enumerated across all 3 owned test files —
 * the only "blue"/"gray" hits are prose comments, not class assertions).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarginByBrandTable } from './MarginByBrandTable'
import type { MarginAnalyticsAggregated } from '@/types/api'

// Round-1 LOW-2: import.meta.url-anchored — cwd-safe (invocations from the parent
// monorepo dir previously threw ENOENT on process.cwd()-relative paths).
const here = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const pageSource = here('../../app/(dashboard)/analytics/brand/page.tsx')
const helpSource = here('../../app/(dashboard)/analytics/brand/components/BrandHelpSection.tsx')
const tableSource = here('./MarginByBrandTable.tsx') // same dir as this guard

/** Owned production surface (exactly 3 files — Story 170.3 scope). */
const OWNED_SOURCES: [string, string][] = [
  ['page.tsx', pageSource],
  ['BrandHelpSection.tsx', helpSource],
  ['MarginByBrandTable.tsx', tableSource],
]

function withoutComments(source: string): string {
  // Round-1 LOW-1: strip BOTH line-start and trailing inline // comments (owned files
  // contain no http:// URLs — verified; conservative direction either way).
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '')
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|scrollbar-thumb|scrollbar-track|decoration|outline|divide)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone|fuchsia|pink|violet|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

// Hex guard: 170.1 3-branch canon (quoted/arbitrary, after ':', unquoted
// inline-style). «#219» prose contract-refs are exempt (after bare whitespace,
// never quote/bracket/':'-anchored — self-tested below).
const CONTEXTUAL_HEX = new RegExp(
  [
    String.raw`(?<!=\s*)(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])`,
    String.raw`(?<=:)\s*#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
    String.raw`(?<=\s)#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
  ].join('|')
)

const RGBA_HSL = /(?:rgba?\(|hsla?\()\s*\d/

const mockBrandData: MarginAnalyticsAggregated[] = [
  {
    brand: 'Brand A',
    revenue_net: 200000,
    qty: 100,
    cogs: 130000,
    profit: 70000,
    operating_profit: 70000,
    margin_pct: 35.0,
    markup_percent: 53.85,
    missing_cogs_count: 0,
  },
]

describe('Story 170.3 brand-margin presentation source contracts', () => {
  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), name).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('owned production sources contain no raw hex literals or rgba()/hsl() colors', () => {
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), `${name} hex`).not.toMatch(CONTEXTUAL_HEX)
      expect(withoutComments(source), `${name} rgba/hsl`).not.toMatch(RGBA_HSL)
    }
  })

  it('hex guard self-test: rejects color hex, exempts «#219» contract prose + URL fragments', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('stroke: #EEEEEE')).toBe(true)
    // Contract #219 prose refs (range-mode nullability comment in page.tsx) — exempt
    expect(CONTEXTUAL_HEX.test('// Contract #219: single-week queries populate FR-2..FR-5')).toBe(
      false
    )
    expect(CONTEXTUAL_HEX.test('#219 covers this')).toBe(false)
    expect(CONTEXTUAL_HEX.test('href="#abc"')).toBe(false)
  })

  it('h1 token pin: page heading is text-2xl font-semibold (169.9/169.10 canon)', () => {
    expect(withoutComments(pageSource)).toMatch(/text-2xl font-semibold/)
    expect(withoutComments(pageSource)).not.toMatch(/text-3xl font-bold/)
  })

  it('help panel token pin: status-information tint pair + foreground body, no blue shade ramp', () => {
    const src = withoutComments(helpSource)
    expect(src).toMatch(/border-status-information\/30 bg-status-information\/15/)
    expect(src).toMatch(/text-foreground/)
    // Round-1 LOW-3: dropped redundant blue-\d00 pin — LEGACY_PALETTE above already covers
    // every blue shade incl. 950 on the same source; the weaker duplicate invited drift.
    // 169.10 foreground-on-tint: heading strength via font, NOT darker tint text
    expect(src).not.toMatch(/text-blue-900/)
  })

  it('table empty-state token pin: muted mirror of page-level empty branch, wording frozen', () => {
    const src = withoutComments(tableSource)
    expect(src).toMatch(/border-border bg-muted/)
    expect(src).toMatch(/text-muted-foreground/)
    // Double-suite pin (table test + e2e BRAND_EMPTY_TEXT) — do NOT change wording
    expect(src).toContain('Нет данных за выбранную неделю')
  })

  it('empty-states ×2 are DISTINCT and BOTH live: page-level (null data) vs table-level ([] data)', () => {
    const page = withoutComments(pageSource)
    const table = withoutComments(tableSource)
    // Page-level empty renders when data?.data is null/undefined…
    expect(page).toMatch(/data\?\.data \? \(/)
    // …and table-level renders on [] — both intentional, not duplicated logic
    expect(table).toMatch(/data\.length === 0/)
    expect(page).toContain('Нет данных за выбранную неделю')
    expect(table).toContain('Нет данных за выбранную неделю')
  })

  it('table RTC pins: static TableCaption, tabular-nums wrapper, scroll region; shared sort untouched', () => {
    const src = withoutComments(tableSource)
    expect(src).toMatch(/<TableCaption>Таблица маржинальности по брендам<\/TableCaption>/)
    expect(src).toMatch(/sticky-first-column tabular-nums/)
    expect(src).toMatch(/scrollContainerTabIndex=\{0\}/)
    expect(src).toMatch(/scrollContainerAriaLabel="Таблица маржинальности по брендам"/)
    // Shared header sort contract preserved (owned table only wires field/order/handler)
    expect(src).toMatch(/sortField=\{sortField\}/)
    expect(src).toMatch(/onSort=\{handleSort\}/)
  })

  it('rendered table exposes caption + named scroll region', () => {
    render(<MarginByBrandTable data={mockBrandData} />)
    expect(screen.getByText('Таблица маржинальности по брендам')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Таблица маржинальности по брендам' })
    ).toBeInTheDocument()
  })

  it('drill-down URL pin: /analytics/sku?brand= via shared page-state wiring', () => {
    const src = withoutComments(pageSource)
    expect(src).toMatch(/drillDownPath: '\/analytics\/sku'/)
    expect(src).toMatch(/drillDownParam: 'brand'/)
    expect(src).toMatch(/onBrandClick=\{state\.handleDrillDown\}/)
  })

  it('ExportDialog pin: by-brand default type + week defaults', () => {
    const src = withoutComments(pageSource)
    expect(src).toMatch(/defaultType="by-brand"/)
    expect(src).toMatch(/defaultWeekStart=\{state\.weekStart\}/)
    expect(src).toMatch(/defaultWeekEnd=\{state\.weekEnd\}/)
  })

  it('C4 disposition pin: shared C4 surfaces are composed, not owned (no local re-implementation)', () => {
    const src = withoutComments(pageSource)
    expect(src).toMatch(/<MarginMissingCogsBanner data=\{data\?\.data\} \/>/)
    expect(src).toMatch(/<StorageComparisonCard data=\{cabinetExpenses\} \/>/)
    // Shared banner/card/dialog implementations are untouched (zero-diff, not re-styled here)
    expect(src).not.toMatch(/className.*(MissingCogs|StorageComparison)/)
  })
})
