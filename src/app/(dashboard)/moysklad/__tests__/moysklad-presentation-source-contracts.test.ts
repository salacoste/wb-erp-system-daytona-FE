/**
 * Story 172.13 micro-guards — Moysklad integration workspace (owned surface:
 * the /moysklad route tree only; APIs/hooks/types/lib are forbidden shared
 * files). Catalog pinned (13 route prod files, per-file identity);
 * no-palette/no-hex over the catalog; semantic contract pins (configured
 * health badge, warning banners ×3 identical shape, recalc badge, primary
 * link, warning headline); 169.11 regex canon; anchor-safe relative-first
 * enumeration (171.8/172.3 lessons).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function component(name: string): string {
  return join(routeDirectory, 'components', name)
}

describe('Story 172.13 moysklad presentation source contracts', () => {
  it('catalog pinned (13 route files, per-file identity)', () => {
    const route = routeProdFiles()
    // Exact relative-path equality (172.10+ canon): rename/add/remove must FAIL.
    const expected = [
      'components/CogsRecalcBadge.tsx',
      'components/LinkMappingDialog.tsx',
      'components/MoyskladHealthBadge.tsx',
      'components/MoyskladMappingRow.tsx',
      'components/MoyskladMappingsPager.tsx',
      'components/MoyskladMappingsTable.tsx',
      'components/MoyskladOverview.tsx',
      'components/MoyskladProductsTable.tsx',
      'components/MoyskladStockTable.tsx',
      'components/MoyskladSyncButton.tsx',
      'components/MoyskladVariantsTable.tsx',
      'components/useRecentlyLinked.ts',
      'page.tsx',
    ]
    const relative = route.map(f => f.slice(routeDirectory.length + 1).replace(/\\/g, '/')).sort()
    expect(relative).toEqual(expected)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of routeProdFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of routeProdFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('health badge pin: configured branch on success tokens', () => {
    const src = readFileSync(component('MoyskladHealthBadge.tsx'), 'utf8')
    expect(src).toMatch(/\? 'border-status-success\/40 bg-status-success\/10 text-foreground'/)
    expect(src).toMatch(/: 'border-destructive\/30 text-destructive'/)
  })

  it('warning banner pin: identical shape in all three tables', () => {
    const shape =
      /border border-status-warning\/40 bg-status-warning\/10 p-3 text-sm text-status-warning/
    for (const name of [
      'MoyskladStockTable.tsx',
      'MoyskladVariantsTable.tsx',
      'MoyskladProductsTable.tsx',
    ]) {
      expect(readFileSync(component(name), 'utf8'), name).toMatch(shape)
    }
  })

  it('recalc + link + headline pins', () => {
    expect(readFileSync(component('CogsRecalcBadge.tsx'), 'utf8')).toMatch(
      /border-status-warning\/40 bg-status-warning\/10 text-status-warning whitespace-nowrap/
    )
    expect(readFileSync(component('MoyskladMappingRow.tsx'), 'utf8')).toMatch(
      /text-primary hover:underline/
    )
    expect(readFileSync(component('MoyskladOverview.tsx'), 'utf8')).toMatch(
      /text-2xl font-bold text-status-warning/
    )
  })
})
