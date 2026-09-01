/**
 * Story 172.14 micro-guards — Orders Overview OWNER-story (owned surface:
 * the /orders route-local files + the shared orders component family
 * src/components/custom/orders/**, explicitly assigned to this Story;
 * src/lib/** (incl. wb-status-data-*, analytics-utils color helpers) is
 * FORBIDDEN — legacy classes flowing through those lib helpers into
 * WbStatusBadge/SlaCompliance/Velocity value colors are a documented
 * lib-wave carry-out, NOT component regressions). Dual-root catalog pinned
 * (6 route-local + 55 shared = 61 files, per-file identity); no-palette/
 * no-hex over both roots; status→token contract pins (SupplierStatus 4-map,
 * OperationalStatus 7-map incl. status-pending SHIPPED, WB-vs-local source
 * distinction pending/muted); Button-conversion pins. 169.11 regex canon;
 * anchor-safe relative-first enumeration.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sharedDirectory = resolve(routeDirectory, '../../../components/custom/orders')

function prodFiles(root: string, excludeDirs: string[] = []): string[] {
  return (
    readdirSync(root, { recursive: true })
      .map(f => f as string)
      .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
      // Cross-restraint (172.14 owner-story): fbo/ and integrity/ subtrees are
      // 172.15/172.16 surfaces — excluded from this Story's catalog AND scans.
      .filter(f => !excludeDirs.some(d => f === d || f.startsWith(`${d}/`)))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(root, f))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function shared(name: string): string {
  return join(sharedDirectory, name)
}

describe('Story 172.14 orders presentation source contracts', () => {
  it('catalog pinned (6 route-local + 55 shared = 61 files, per-file identity)', () => {
    const route = prodFiles(routeDirectory, ['fbo', 'integrity']).map(f =>
      f.slice(routeDirectory.length + 1).replace(/\\/g, '/')
    )
    expect(route).toEqual([
      'OrdersPageStates.tsx',
      'error.tsx',
      'loading.tsx',
      'page.tsx',
      'useOrdersFilterHandlers.ts',
      'useOrdersPageState.ts',
    ])
    const sharedFiles = prodFiles(sharedDirectory).map(f =>
      f.slice(sharedDirectory.length + 1).replace(/\\/g, '/')
    )
    expect(sharedFiles).toHaveLength(55)
    for (const name of [
      'OrderStatusBadge.tsx',
      'OperationalStatusBadge.tsx',
      'OrdersRowHelpers.tsx',
      'OrdersTableRow.tsx',
      'OrdersEmptyState.tsx',
      'OrdersErrorBoundary.tsx',
      'FullHistoryTab.tsx',
      'LocalHistoryEntryItem.tsx',
      'WbHistoryTabParts.tsx',
      'timeline/WbStatusBadge.tsx',
      'timeline/HistorySourceBadge.tsx',
      'analytics/AtRiskOrderRow.tsx',
      'analytics/SlaComplianceWidget.tsx',
      'analytics/OrderSyncStatus.tsx',
    ]) {
      expect(sharedFiles, name).toContain(name)
    }
  })

  it('no legacy palette classes in any production file (both roots)', () => {
    for (const f of [
      ...prodFiles(routeDirectory, ['fbo', 'integrity']),
      ...prodFiles(sharedDirectory),
    ]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of [
      ...prodFiles(routeDirectory, ['fbo', 'integrity']),
      ...prodFiles(sharedDirectory),
    ]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('supplier status pin: readable text with status-tinted backgrounds', () => {
    const src = readFileSync(shared('OrderStatusBadge.tsx'), 'utf8')
    expect(src).toMatch(/text-foreground/)
    expect(src).toMatch(/bg-status-warning\/10/)
    expect(src).toMatch(/bg-status-information\/10/)
    expect(src).toMatch(/bg-status-success\/10/)
    expect(src).toMatch(/bg-status-error\/10/)
  })

  it('operational status pin: SHIPPED on the purple status-pending token (hue 277)', () => {
    const src = readFileSync(shared('OperationalStatusBadge.tsx'), 'utf8')
    expect(src).toMatch(/text-status-pending/)
    expect(src).toMatch(/bg-status-pending\/10/)
    // RETURNED stays neutral-muted, not colored.
    expect(src).toMatch(/text-muted-foreground/)
  })

  it('source distinction pin: WB-native = status-pending, local = muted', () => {
    const src = readFileSync(shared('timeline/HistorySourceBadge.tsx'), 'utf8')
    expect(src).toMatch(/text-status-pending/)
    expect(src).toMatch(/text-muted-foreground/)
    expect(readFileSync(shared('FullHistoryTab.tsx'), 'utf8')).toMatch(/bg-status-pending/)
  })

  it('button conversion pin: ui Buttons carry explicit type=button', () => {
    expect(readFileSync(shared('analytics/AtRiskOrderRow.tsx'), 'utf8')).toMatch(
      /<Button[^>]*type="button"/
    )
    expect(readFileSync(shared('OrdersRowHelpers.tsx'), 'utf8')).toMatch(/type="button"/)
    expect(readFileSync(shared('OrdersTableRow.tsx'), 'utf8')).toMatch(/<Button/)
  })

  it('analytics pin: icon/badge valence on status tokens', () => {
    expect(readFileSync(shared('analytics/SlaComplianceWidget.tsx'), 'utf8')).toMatch(
      /text-status-success/
    )
    expect(readFileSync(shared('analytics/OrderSyncStatus.tsx'), 'utf8')).toMatch(
      /bg-status-success/
    )
    expect(readFileSync(shared('OrdersErrorBoundary.tsx'), 'utf8')).toMatch(/text-status-warning/)
  })
})
