/**
 * Story 172.15 micro-guards — FBO Orders (owned surface: the /orders/fbo
 * route tree only; hooks/types/lib are forbidden shared files). Born-clean
 * surface (0 legacy palette/hex/raw buttons pre-diff); catalog pinned (7
 * route prod files, per-file identity); no-palette/no-hex over the catalog;
 * contract pins (RTC captions on both tables, tabular-nums on dates/money,
 * badge valence destructive/default, loading/empty states). 169.11 regex
 * canon; anchor-safe relative-first enumeration.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function routeProdFiles(): string[] {
  return readdirSync(routeDirectory, { recursive: true })
    .map(f => f as string)
    .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
    .filter(f => !/\.(?:test|spec)\./.test(f))
    .filter(f => /\.(?:ts|tsx)$/.test(f))
    .map(f => join(routeDirectory, f))
    .sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function component(name: string): string {
  return join(routeDirectory, 'components', name)
}

describe('Story 172.15 fbo presentation source contracts', () => {
  it('catalog pinned (7 route files, per-file identity)', () => {
    const route = routeProdFiles()
    expect(route).toHaveLength(7)
    const expected = [
      'components/FboAggregateCards.tsx',
      'components/FboOrdersPageContent.tsx',
      'components/FboOrdersTable.tsx',
      'components/FboSalesAggregateCards.tsx',
      'components/FboSalesTable.tsx',
      'components/FboSyncControls.tsx',
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

  it('caption pin: both tables render RTC captions conditionally (render-shape)', () => {
    for (const name of ['FboOrdersTable.tsx', 'FboSalesTable.tsx']) {
      expect(readFileSync(component(name), 'utf8'), name).toMatch(/captionText \? <TableCaption>/)
    }
    const page = readFileSync(component('FboOrdersPageContent.tsx'), 'utf8')
    expect(page).toMatch(/captionText="Заказы FBO Wildberries"/)
    expect(page).toMatch(/captionText="Продажи FBO Wildberries"/)
  })

  it('tabular pin: dates and money align digits in both tables', () => {
    for (const name of ['FboOrdersTable.tsx', 'FboSalesTable.tsx']) {
      expect(readFileSync(component(name), 'utf8'), name).toMatch(/whitespace-nowrap tabular-nums/)
      expect(readFileSync(component(name), 'utf8'), name).toMatch(
        /text-right whitespace-nowrap tabular-nums/
      )
    }
  })

  it('badge valence pin: cancel/storno destructive, active/default', () => {
    expect(readFileSync(component('FboOrdersTable.tsx'), 'utf8')).toMatch(
      /<Badge variant="destructive">Отменён<\/Badge>/
    )
    expect(readFileSync(component('FboSalesTable.tsx'), 'utf8')).toMatch(
      /<Badge variant="destructive">Возврат<\/Badge>/
    )
  })

  it('state pin: loading spinner + empty states stay muted (not colored)', () => {
    const orders = readFileSync(component('FboOrdersTable.tsx'), 'utf8')
    expect(orders).toMatch(/animate-spin text-muted-foreground/)
    expect(orders).toMatch(/fbo-orders-empty/)
    expect(readFileSync(component('FboSalesTable.tsx'), 'utf8')).toMatch(/fbo-sales-empty/)
  })
})
