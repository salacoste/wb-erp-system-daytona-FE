/**
 * Story 172.5 micro-guards — single-product COGS management (owned surface:
 * the /cogs route page + the ProductList-family, SingleCogs and Cogs custom
 * components; bulk route = 172.6, history = 172.7, price-calculator = 172.8).
 * Pinned root-file catalog + full no-palette/no-hex scans over the pinned
 * files and the single-cogs/product-margin-cell/products trees; valence and
 * state-token pins. 169.11 regex canon (contextual, prose-exempt hex);
 * anchor-safe relative-first enumeration (171.8/172.3 lessons:
 * separator-anchored exclusions, per-file catalog identity).
 */
import { readFileSync, readdirSync } from 'node:fs'
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

/** Owned root-level custom files (single-COGS family; pinned identity). */
const pinnedRootFiles = [
  'ProductList.tsx',
  'ProductListStates.tsx',
  'ProductListTableHeader.tsx',
  'ProductSearchFilter.tsx',
  'ProductTableRow.tsx',
  'ProductCountMetricCard.tsx',
  'ProductEmptyState.tsx',
  'ProductLoadingSkeleton.tsx',
  'ProductPagination.tsx',
  'ProductMarginCell.tsx',
  'SingleCogsForm.tsx',
  'CogsEditDialog.tsx',
  'CogsDeleteDialog.tsx',
  'CogsCoverageMetricCard.tsx',
  // Review pass-1 additions: HistoricalMarginContext renders transitively on
  // the /cogs surface (margin cell → NO_SALES_DATA branch). CogsMissingState
  // is dead code today (MetricCardEnhanced ← ProductCountMetricCard has zero
  // importers) but is pinned to prevent palette regression if re-wired.
  'CogsMissingState.tsx',
  'HistoricalMarginContext.tsx',
  // Review pass-2 additions (transitive-audit findings): both render LIVE on
  // /cogs — the polling status (SingleCogsFormStatus polling branch) and the
  // resize grip on every product-table column header. useProductListHandlers
  // is in the live closure (clean today, pinned against drift).
  'MarginCalculationStatus.tsx',
  'ResizableTableHead.tsx',
  'useProductListHandlers.ts',
  'cogs-missing-state-config.ts',
  'cogs-edit-helpers.ts',
].map(f => join(customRoot, f))

const routePage = join(routeDirectory, 'page.tsx')

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
  it('pinned root-file catalog exists (21 custom files + the /cogs page)', () => {
    for (const f of [...pinnedRootFiles, routePage]) {
      expect(() => readFileSync(f, 'utf8'), f).not.toThrow()
    }
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

  it('margin-valence pin: margin cell signs on status tokens', () => {
    const cell = readFileSync(join(customRoot, 'ProductMarginCell.tsx'), 'utf8')
    expect(cell).toMatch(/text-status-success/)
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
