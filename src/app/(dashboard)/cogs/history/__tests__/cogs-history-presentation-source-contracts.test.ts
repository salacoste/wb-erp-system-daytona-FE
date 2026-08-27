/**
 * Story 172.7 micro-guards — COGS history (owned surface: the /cogs/history
 * route tree + the CogsHistory widget family and AffectedWeeksCell in the
 * custom root; single-COGS = 172.5, bulk = 172.6, price-calculator = 172.8).
 * Catalog pinned (route prod files + widget files, per-file identity);
 * no-palette/no-hex over the catalog (born-clean surface — this guard pins
 * it against regression); caption + tabular-nums table-contract pins;
 * deleted-row muted pin. 169.11 regex canon; anchor-safe relative-first
 * enumeration (171.8/172.3 lessons).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Depth-4 route (app/(dashboard)/cogs/history): 4× up reaches src/.
const customRoot = resolve(routeDirectory, '..', '..', '..', '..', 'components', 'custom')

function routeProdFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8/172.3): filter RELATIVE entries BEFORE join;
      // separator-anchored test-dir exclusion (nested included).
      .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f))
      .sort()
  )
}

/** Owned custom-root widgets (the history family). */
const widgetFiles = [
  'CogsHistoryMeta.tsx',
  'CogsHistoryPagination.tsx',
  'CogsHistoryTable.tsx',
  'AffectedWeeksCell.tsx',
  'CogsHistoryTableCells.tsx',
].map(f => join(customRoot, f))

function productionFiles(): string[] {
  return [...routeProdFiles(), ...widgetFiles].sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.7 cogs-history presentation source contracts', () => {
  it('catalog pinned (5 route files + 5 widget files, per-file identity)', () => {
    const route = routeProdFiles()
    expect(route).toHaveLength(5)
    for (const name of [
      'page.tsx',
      'CogsHistoryPageStates.tsx',
      'CogsHistoryBreadcrumbs.tsx',
      'cogs-history-utils.tsx',
      'useCogsHistoryPageState.ts',
    ]) {
      expect(
        route.some(f => f.endsWith(name)),
        name
      ).toBe(true)
    }
    for (const f of widgetFiles) {
      expect(existsSync(f), f).toBe(true)
    }
  })

  it('no legacy palette classes in any production file (born-clean pinned)', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('caption pin: table renders the product-named caption (RTC a11y contract)', () => {
    const table = readFileSync(join(customRoot, 'CogsHistoryTable.tsx'), 'utf8')
    expect(table).toMatch(/captionText \? <TableCaption>/)
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).toMatch(/captionText=\{`История себестоимости/)
  })

  it('tabular-nums pin: date and cost cells align digits', () => {
    const table = readFileSync(join(customRoot, 'CogsHistoryTable.tsx'), 'utf8')
    expect(table).toMatch(/tabular-nums/)
  })

  it('deleted-row pin: soft-deleted rows de-emphasize on muted tokens', () => {
    const table = readFileSync(join(customRoot, 'CogsHistoryTable.tsx'), 'utf8')
    expect(table).toMatch(/bg-muted\/50 opacity-60/)
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
    // NOTE: CogsHistoryLoading's CardContent pt-6 is INTRA-card spacing, not
    // route-level: ui CardContent defaults to `p-6 pt-0` (header-first design),
    // and the skeleton Card has NO header, so pt-6 restores its top padding —
    // a legitimate no-header-card pattern, deliberately out of this pin.
  })
})
