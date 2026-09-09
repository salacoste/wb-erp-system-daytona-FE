/**
 * Story 172.5 micro-guards — single-product COGS management (owned surface:
 * the /cogs route page + the ProductList-family, SingleCogs and Cogs custom
 * components; bulk route = 172.6, history = 172.7, price-calculator = 172.8).
 * 172.10 exact-array catalog pins (root family + per-subdir literals, disk
 * discovery vs literal) + full no-palette/no-hex scans over the pinned
 * files and the single-cogs/product-margin-cell/products trees; valence and
 * state-token pins. 169.11 regex canon (contextual, prose-exempt hex);
 * anchor-safe relative-first enumeration (171.8/172.3 lessons:
 * separator-anchored exclusions, per-file catalog identity).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const customRoot = resolve(routeDirectory, '..', '..', '..', 'components', 'custom')

function prodFilesUnder(dir: string): string[] {
  return (
    readdirSync(dir, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8/172.3): filter RELATIVE entries BEFORE join;
      // separator-anchored test-dir exclusion (nested included).
      .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(dir, f))
      .sort()
  )
}

/**
 * components/custom/ is SHARED with sibling guards (bulk = 172.6, history =
 * 172.7, price-calculator = 172.8, margin tables, dashboard widgets), so the
 * single-COGS family root surface is scoped by name prefixes: on today's disk
 * these prefixes match exactly the pinned root catalog — a NEW family file
 * matching any prefix fails the pin; non-matching files belong to siblings.
 */
const SINGLE_COGS_FAMILY_PREFIXES = [
  'Product',
  'SingleCogs',
  'CogsEdit',
  'CogsDelete',
  'CogsCoverage',
  'CogsMissing',
  'HistoricalMargin',
  'MarginCalculationStatus',
  'ResizableTableHead',
  'useProductList',
  'cogs-',
]

/** Owned root-level custom files (single-COGS family; 172.10 exact pin). */
const ROOT_CATALOG = [
  'CogsCoverageMetricCard.tsx',
  'CogsDeleteDialog.tsx',
  'CogsEditDialog.tsx',
  // Review pass-1 addition: CogsMissingState is dead code today
  // (MetricCardEnhanced ← ProductCountMetricCard has zero importers) but is
  // pinned to prevent palette regression if re-wired.
  'CogsMissingState.tsx',
  // Review pass-1 addition: HistoricalMarginContext renders transitively on
  // the /cogs surface (margin cell → NO_SALES_DATA branch).
  'HistoricalMarginContext.tsx',
  // Review pass-2 addition (transitive-audit finding): renders LIVE on /cogs
  // — the polling status (SingleCogsFormStatus polling branch).
  'MarginCalculationStatus.tsx',
  'ProductCountMetricCard.tsx',
  'ProductEmptyState.tsx',
  'ProductList.tsx',
  'ProductListStates.tsx',
  'ProductListTableHeader.tsx',
  'ProductLoadingSkeleton.tsx',
  'ProductMarginCell.tsx',
  'ProductPagination.tsx',
  'ProductSearchFilter.tsx',
  'ProductTableRow.tsx',
  // Review pass-2 addition (transitive-audit finding): the resize grip on
  // every product-table column header.
  'ResizableTableHead.tsx',
  'SingleCogsForm.tsx',
  'cogs-edit-helpers.ts',
  'cogs-missing-state-config.ts',
  // Review pass-2 addition: in the live closure (clean today, pinned against
  // drift).
  'useProductListHandlers.ts',
]

const pinnedRootFiles = ROOT_CATALOG.map(f => join(customRoot, f))

const routePage = join(routeDirectory, 'page.tsx')

/** Per-subdir owned catalogs (172.10 exact pins; discovery helpers kept). */
const SUBDIR_CATALOGS: Array<{ dir: string; files: string[] }> = [
  {
    dir: 'single-cogs',
    files: [
      'FutureDateWarning.tsx',
      'ProductInfoCard.tsx',
      'SingleCogsFormActions.tsx',
      'SingleCogsFormFields.tsx',
      'SingleCogsFormStatus.tsx',
      'form-helpers.ts',
    ],
  },
  {
    dir: 'product-margin-cell',
    files: [
      'COGSNotAssignedContext.tsx',
      'CalculationInProgressDisplay.tsx',
      'MissingDataReasonDisplay.tsx',
      'product-margin-utils.ts',
    ],
  },
  { dir: 'products', files: ['BrandSubjectFilter.tsx'] },
]

function productionFiles(): string[] {
  return [
    ...pinnedRootFiles,
    routePage,
    ...prodFilesUnder(join(customRoot, 'single-cogs')),
    ...prodFilesUnder(join(customRoot, 'product-margin-cell')),
    ...prodFilesUnder(join(customRoot, 'products')),
  ].sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.5 single-COGS presentation source contracts', () => {
  it('root catalog pinned (21 single-COGS family files + the /cogs page)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin (upgrades the former existence-only assertion).
    const expected = [...ROOT_CATALOG].sort()
    const discovered = readdirSync(customRoot, { withFileTypes: true })
      .filter(entry => entry.isFile() && /\.tsx?$/.test(entry.name))
      .filter(entry => !/\.(?:test|spec)\.[jt]sx?$/.test(entry.name))
      .map(entry => entry.name)
      .filter(name => SINGLE_COGS_FAMILY_PREFIXES.some(prefix => name.startsWith(prefix)))
      .map(name =>
        join(customRoot, name)
          .slice(customRoot.length + 1)
          .replace(/\\/g, '/')
      )
      .sort()
    expect(discovered).toEqual(expected)
    expect(existsSync(routePage), 'src/app/(dashboard)/cogs/page.tsx').toBe(true)
  })

  it.each(SUBDIR_CATALOGS)('$dir/ catalog pinned (per-file identity)', ({ dir, files }) => {
    // Exact relative-path equality (172.10 canon) per dynamic subdir.
    const subdir = join(customRoot, dir)
    const relative = prodFilesUnder(subdir)
      .map(f => f.slice(subdir.length + 1).replace(/\\/g, '/'))
      .sort()
    expect(relative).toEqual([...files].sort())
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#22C55E'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('missing-state pin: critical keeps a SOLID error block, warning/info on tints', () => {
    const config = readFileSync(join(customRoot, 'cogs-missing-state-config.ts'), 'utf8')
    expect(config).toMatch(/critical[\s\S]*?bg-status-error\b/)
    expect(config).toMatch(/text-status-error-foreground/)
    expect(config).toMatch(/warning[\s\S]*?bg-status-warning\/10/)
  })

  it('margin-valence pin: margin cell signs on status tokens (wave-6: positive = fg-on-tint)', () => {
    const cell = readFileSync(join(customRoot, 'ProductMarginCell.tsx'), 'utf8')
    // wave-6 AA: text-status-success on the selected-row stack = 4.44/3.82
    // light (FAIL 4.5) → positive sign is fg-on-tint (text-foreground, ≥10.59/10.48
    // on every row state); negative sign keeps text-status-error (5.66/4.87).
    expect(cell).toMatch(/'text-foreground'/)
    expect(cell).not.toMatch(/text-status-success/)
    expect(cell).toMatch(/text-status-error/)
  })

  it('row-state pin: selected row on the information tint idiom', () => {
    const row = readFileSync(join(customRoot, 'ProductTableRow.tsx'), 'utf8')
    expect(row).toMatch(/bg-status-information\/10/)
  })

  it('form-status pin: single-COGS success alert on the success tint idiom', () => {
    const status = readFileSync(join(customRoot, 'single-cogs', 'SingleCogsFormStatus.tsx'), 'utf8')
    expect(status).toMatch(/border-status-success\/40/)
    expect(status).toMatch(/bg-status-success\/10/)
  })

  it('scope pin: bulk/history/price-calculator route files are NOT in this catalog', () => {
    const all = productionFiles().join('\n')
    expect(all).not.toContain(join('cogs', 'bulk'))
    expect(all).not.toContain(join('cogs', 'history'))
    expect(all).not.toContain(join('cogs', 'price-calculator'))
  })
})
