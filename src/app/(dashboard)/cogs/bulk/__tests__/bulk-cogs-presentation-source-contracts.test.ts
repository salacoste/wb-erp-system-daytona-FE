/**
 * Story 172.6 micro-guards — bulk COGS assignment (owned surface: the
 * /cogs/bulk route page + the BulkCogsForm re-export shim + the
 * bulk-cogs/** component tree; the single-COGS surface belongs to 172.5,
 * history = 172.7, price-calculator = 172.8 — excluded by construction).
 * Catalog: route page + shim pinned by path; bulk-cogs tree enumerated
 * (pinned count, per-file identity); no-palette/no-hex over the whole
 * catalog; valence/state pins (alerts summary tiles, selected rows,
 * form-validation destructive, preview/primary button). 169.11 regex canon;
 * anchor-safe relative-first enumeration (171.8/172.3 lessons).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Depth-4 route (app/(dashboard)/cogs/bulk): 4× up reaches src/.
const customRoot = resolve(routeDirectory, '..', '..', '..', '..', 'components', 'custom')
const bulkTree = join(customRoot, 'bulk-cogs')
const formShim = join(customRoot, 'BulkCogsForm.tsx')
const routePage = join(routeDirectory, 'page.tsx')

function bulkTreeProdFiles(): string[] {
  return (
    readdirSync(bulkTree, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8/172.3): filter RELATIVE entries BEFORE join;
      // separator-anchored test-dir exclusion (nested included).
      .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(bulkTree, f))
      .sort()
  )
}

function productionFiles(): string[] {
  return [...bulkTreeProdFiles(), formShim, routePage].sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.6 bulk-COGS presentation source contracts', () => {
  it('bulk-cogs tree catalog pinned (11 files + shim + route page)', () => {
    const tree = bulkTreeProdFiles()
    expect(tree).toHaveLength(11)
    for (const name of [
      'BulkCogsAlerts.tsx',
      'BulkCogsForm.tsx',
      'BulkCogsFormInputs.tsx',
      'BulkCogsPreviewDialog.tsx',
      'BulkCogsProductTable.tsx',
      'BulkCogsResultsDialog.tsx',
      'BulkCogsSearch.tsx',
      'bulk-cogs.types.ts',
      'useBulkCogsSelection.ts',
      'useBulkCogsSubmit.ts',
      'useCursorPagination.ts',
    ]) {
      expect(
        tree.some(f => f.endsWith(name)),
        name
      ).toBe(true)
    }
    expect(() => readFileSync(formShim, 'utf8')).not.toThrow()
    expect(() => readFileSync(routePage, 'utf8')).not.toThrow()
  })

  it('no legacy palette classes in any production file', () => {
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

  it('alerts pin: summary tiles on success/error tints; text meaning survives', () => {
    const alerts = readFileSync(join(bulkTree, 'BulkCogsAlerts.tsx'), 'utf8')
    expect(alerts).toMatch(/border-status-success\/40/)
    expect(alerts).toMatch(/border-status-error\/40/)
  })

  it('selected-row pin: selection highlight on the information tint idiom (172.5 pairing)', () => {
    const table = readFileSync(join(bulkTree, 'BulkCogsProductTable.tsx'), 'utf8')
    expect(table).toMatch(/bg-status-information\/10/)
    expect(table).toMatch(/scrollContainerTabIndex=\{0\}/)
    expect(table).toMatch(/scrollContainerAriaLabel="Товары без назначенной себестоимости"/)
    expect(table).toMatch(/<TableCaption className="sr-only">/)
    expect(table).not.toMatch(/rounded-md border overflow-x-auto/)
  })

  it('form-validation pin: bulk form errors on the destructive token (sibling of SingleCogsFormFields)', () => {
    const inputs = readFileSync(join(bulkTree, 'BulkCogsFormInputs.tsx'), 'utf8')
    expect(inputs).toMatch(/text-destructive/)
    expect(inputs).toMatch(/border-destructive/)
  })

  it('primary-action pin: submit/confirm render the default primary variant (no color overrides)', () => {
    const form = readFileSync(join(bulkTree, 'BulkCogsForm.tsx'), 'utf8')
    expect(form).not.toMatch(/bg-blue-600|bg-primary\s/)
    const preview = readFileSync(join(bulkTree, 'BulkCogsPreviewDialog.tsx'), 'utf8')
    expect(preview).not.toMatch(/bg-blue-600/)
  })
})
