/**
 * Story 170.6-FE cross-reference presentation source contracts.
 *
 * Canon: 170.1-170.5 guard suite (recursive no-palette/no-hex over the owned
 * production surface + explicit token pins). Post-deletion accounting (validator E2):
 * the orphan ProductScatterChart deletion removed its ~8 legacy sites with it — this
 * guard pins BOTH the deleted file's absence AND the remaining tree's cleanliness,
 * so no double-count credit is possible.
 *
 * Owned production surface = exactly 14 files (pinned):
 *   page.tsx + 11 components (incl. the new route-owned SortButton + channel-styling)
 *   + 2 utils. Tests/docs are NOT part of the surface.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// NOTE: `new URL('<static>', import.meta.url)` gets rewritten by the Vite test
// transform (asset handling) and loses the file: scheme — hence path.resolve on
// fileURLToPath(import.meta.url), which the transform leaves alone.
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const here = (rel: string) => readFileSync(resolve(TEST_DIR, rel), 'utf8')

/** Owned production sources (exactly 14 files — Story 170.6 scope, post-deletion). */
const OWNED_SOURCES: [string, string][] = [
  ['page.tsx', here('../../page.tsx')],
  ['CrossReferenceStates.tsx', here('../CrossReferenceStates.tsx')],
  ['CrossReferenceTable.tsx', here('../CrossReferenceTable.tsx')],
  ['SortButton.tsx', here('../SortButton.tsx')],
  ['OverlapSummaryCards.tsx', here('../OverlapSummaryCards.tsx')],
  ['InsightsCards.tsx', here('../InsightsCards.tsx')],
  ['OrganicVsAdScatter.tsx', here('../OrganicVsAdScatter.tsx')],
  ['AdOrganicOverlapTable.tsx', here('../AdOrganicOverlapTable.tsx')],
  ['PositionSpendChart.tsx', here('../PositionSpendChart.tsx')],
  ['CannibalizationAnalysis.tsx', here('../CannibalizationAnalysis.tsx')],
  ['CrossReferencePageContent.tsx', here('../CrossReferencePageContent.tsx')],
  ['channel-styling.ts', here('../channel-styling.ts')],
  ['cross-reference-utils.ts', here('../../utils/cross-reference-utils.ts')],
  ['ad-search-correlation-utils.ts', here('../../utils/ad-search-correlation-utils.ts')],
]

function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '')
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|scrollbar-thumb|scrollbar-track|decoration|outline|divide)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone|fuchsia|pink|violet|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

// Hex guard: 170.1 3-branch canon (quoted/arbitrary, after ':', unquoted inline-style).
const CONTEXTUAL_HEX = new RegExp(
  [
    String.raw`(?<!=\s*)(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])`,
    String.raw`(?<=:)\s*#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
    String.raw`(?<=\s)#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
  ].join('|')
)

const RGBA_HSL = /(?:rgba?\(|hsla?\()\s*\d/

describe('Story 170.6 cross-reference presentation source contracts', () => {
  it('owned production surface is exactly 14 files (pinned file count, post-deletion)', () => {
    expect(OWNED_SOURCES).toHaveLength(14)
    // The pinned count must track the REAL tree (recursive) — catches silent
    // additions/deletions of production files in the owned route.
    const root = resolve(TEST_DIR, '../..')
    const realFiles: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true }) as Dirent[]) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else if (/\.(tsx|ts)$/.test(entry.name) && !p.includes('__tests__')) realFiles.push(p)
      }
    }
    walk(root)
    expect(realFiles, realFiles.join(', ')).toHaveLength(14)
  })

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

  it('hex guard self-test: rejects color hex, exempts prose + URL fragments', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('stroke: #EEEEEE')).toBe(true)
    expect(CONTEXTUAL_HEX.test('// Contract #219 covers this')).toBe(false)
    expect(CONTEXTUAL_HEX.test('href="#abc"')).toBe(false)
  })

  it('POST-DELETION accounting: orphan ProductScatterChart.tsx is deleted (absence pin)', () => {
    const orphanPath = resolve(TEST_DIR, '../ProductScatterChart.tsx')
    expect(existsSync(orphanPath)).toBe(false)
    // And no owned source references it (doc comments included — full text, not comment-stripped)
    for (const [name, source] of OWNED_SOURCES) {
      expect(source, name).not.toContain('ProductScatterChart')
    }
  })

  it('SortButton absence pin: NO owned source imports from the forbidden search tree', () => {
    // The attribution COMMENT in the route-owned copy mentions the source path —
    // only IMPORT STATEMENTS are pinned absent (prose attribution is intentional).
    for (const [name, source] of OWNED_SOURCES) {
      expect(source, name).not.toMatch(/from '@\/app\/\(dashboard\)\/analytics\/search\//)
    }
    // The route-owned copy exists and is the import used by the table
    expect(withoutComments(OWNED_SOURCES[2][1])).toMatch(/from '\.\/SortButton'/)
    // Round-2 F1(r2)/F3: block relative-path bypass into the forbidden search tree.
    // Round-1's version double-escaped the dots (\\. = literal backslash in a regex
    // literal) — a vacuous guard that never matched ANY import; verified by round-2.
    const RELATIVE_BYPASS = /from '\.\..*search\/components\//
    // Positive self-test (hex-guard pattern): the guard MUST catch a real bypass.
    expect(
      RELATIVE_BYPASS.test("import X from '../../search/components/SortButton'")
    ).toBe(true)
    expect(RELATIVE_BYPASS.test("import X from '@/(dashboard)/analytics/search/x'")).toBe(false)
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), name).not.toMatch(RELATIVE_BYPASS)
    }
    expect(withoutComments(OWNED_SOURCES[3][1])).toMatch(/ArrowUpDown/)
  })

  it('runtime negative: no bg-white tooltips anywhere in the owned surface', () => {
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), name).not.toMatch(/\bbg-white\b/)
    }
  })

  it('channel map single-source pin: table/cards/scatter all consume CHANNEL_STYLES', () => {
    const table = withoutComments(OWNED_SOURCES[2][1])
    const cards = withoutComments(OWNED_SOURCES[4][1])
    const scatter = withoutComments(OWNED_SOURCES[6][1])
    expect(table).toMatch(/CHANNEL_STYLES\[item\.channel\]\.badgeClassName/)
    expect(cards).toMatch(/CHANNEL_STYLES\.organic\.tileClassName/)
    expect(scatter).toMatch(/CHANNEL_STYLES\[channel\]\.chartFill/)
    // No local channel color records remain
    for (const src of [table, cards, scatter]) {
      expect(src).not.toMatch(/CHANNEL_COLORS/)
      expect(src).not.toMatch(/bg-(green|blue|purple)-100/)
    }
  })

  it('channel map token pin: semantic status tokens + neutral muted "both" + categorical chart-N fills', () => {
    const src = withoutComments(OWNED_SOURCES[11][1])
    expect(src).toMatch(/organic:[\s\S]*?status-success/)
    expect(src).toMatch(/ad:[\s\S]*?status-information/)
    expect(src).toMatch(/both:[\s\S]*?bg-muted text-foreground/)
    expect(src).toMatch(/var\(--color-chart-[123]\)/)
  })

  it('h1 token pin: page heading is text-2xl font-semibold text-foreground (170.3 canon)', () => {
    const src = withoutComments(OWNED_SOURCES[10][1])
    expect(src).toMatch(/text-2xl font-semibold/)
    expect(src).toMatch(/text-foreground/)
    expect(src).not.toMatch(/text-3xl font-bold/)
  })

  it('tooltip canon pin: both surviving tooltips use bg-popover + popover-foreground', () => {
    for (const idx of [6, 8]) {
      const src = withoutComments(OWNED_SOURCES[idx][1])
      expect(src).toMatch(/bg-popover text-popover-foreground/)
    }
  })

  it('grid/axis token pin: var(--color-border) grid/reference lines + chart-axis ticks', () => {
    for (const idx of [6, 8]) {
      const src = withoutComments(OWNED_SOURCES[idx][1])
      expect(src).toMatch(/stroke="var\(--color-border\)"/)
      expect(src).toMatch(/fill: 'var\(--color-chart-axis\)'/)
      expect(src).not.toContain('#9CA3AF')
    }
  })

  it('overlap chip pin: 75/40 thresholds + status /15+/30 triplets', () => {
    const src = withoutComments(OWNED_SOURCES[7][1])
    expect(src).toMatch(/pct >= 75[\s\S]*?status-error\/15/)
    expect(src).toMatch(/pct >= 40[\s\S]*?status-warning\/15/)
    expect(src).toMatch(/status-success\/15/)
  })

  it('risk chip pin: cannibalization status triplets + lucide icons (no emoji)', () => {
    const src = withoutComments(OWNED_SOURCES[9][1])
    expect(src).toMatch(/status-error\/15[\s\S]*?AlertTriangle/)
    expect(src).toMatch(/status-warning\/15[\s\S]*?AlertCircle/)
    expect(src).toMatch(/status-success\/15[\s\S]*?CheckCircle/)
    expect(src).toMatch(/text-status-warning/)
    expect(src).not.toMatch(/🔴|🟡|🟢/)
  })

  it('taxonomy-unification source-contract: CorrelationBadge consumes util interpretCorrelation only', () => {
    const chart = withoutComments(OWNED_SOURCES[8][1])
    expect(chart).toMatch(
      /import \{\s*\n?\s*computePositionSpendCorrelation,\s*\n?\s*interpretCorrelation,/
    )
    expect(chart).toMatch(/interpretation\.badgeClassName/)
    expect(chart).toMatch(/interpretation\.label/)
    // The former local ladders are gone
    expect(chart).not.toContain('Заметная')
    expect(chart).not.toMatch(/pct < (20|40|60|80|30|60)/)
  })

  it('empty-state distinctness pin: per-section «Недостаточно данных» ≠ page EmptyState text', () => {
    const chart = withoutComments(OWNED_SOURCES[8][1])
    const states = withoutComments(OWNED_SOURCES[1][1])
    const page = withoutComments(OWNED_SOURCES[10][1])
    expect(chart).toContain('Недостаточно данных для построения графика')
    expect(states).toContain('Нет данных за выбранный период')
    // Page renders EmptyState (not a local duplicate) for the no-data branch
    expect(page).toMatch(/mergedData\.length === 0 && <EmptyState \/>/)
  })

  it('AC-2 wiring pin: one-source banner + both-fail ErrorState + third-query section banner', () => {
    const page = withoutComments(OWNED_SOURCES[10][1])
    expect(page).toMatch(/bothFailed && <ErrorState/)
    expect(page).toMatch(/oneFailed && \(\s*<SourceErrorBanner/)
    expect(page).toMatch(/searchByQueryQuery\.isError \? \(\s*<SectionWarningBanner/)
    // Partial merge: failed side contributes no rows but loaded side still merges
    expect(page).toMatch(/if \(!searchItems && !adItems\) return \[\]/)
    expect(page).toMatch(/mergeSearchAndAdData\(searchItems \?\? \[\], adItems \?\? \[\]\)/)
  })

  it('e2e-pinned layout classes preserved: OverlapSummaryCards keeps sm:grid-cols-3', () => {
    const cards = withoutComments(OWNED_SOURCES[4][1])
    expect(cards).toContain('sm:grid-cols-3')
    expect(cards).toContain('Только органика')
  })
})
