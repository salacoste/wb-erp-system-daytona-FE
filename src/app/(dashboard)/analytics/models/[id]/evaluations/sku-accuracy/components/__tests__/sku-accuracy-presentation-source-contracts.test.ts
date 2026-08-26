/**
 * Story 171.8 micro-guards — SKU accuracy detail route (owned surface ONLY:
 * sku-accuracy page.tsx + components tree; parent evaluations tree belongs to
 * Story 171.7). no-palette/no-hex over the 5 production files; caption pins
 * (both tables name their subject — RTC); tabular-nums pins; route-padding pins.
 * 169.11 regex canon (letter-lookahead, prose-exempt hex).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function productionFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8): filter RELATIVE segments BEFORE join — substring filters on
      // joined absolute paths also match the checkout/worktree name (171.7 guard lesson).
      .filter(f => !f.includes('__tests__'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f as string))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 171.8 route presentation source contracts', () => {
  it('production catalog pinned (5 files)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(5)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith(join('sku-accuracy', 'page.tsx')))).toBe(true)
    expect(files.some(f => f.endsWith('SkuAccuracyDetail.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('SkuAccuracyOverview.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('SkuAccuracyTable.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('sku-accuracy-helpers.ts'))).toBe(true)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted #EEEEEE caught, #197 prose exempt)', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('caption pin: overview table names the model; history table names the SKU (RTC)', () => {
    const table = readFileSync(join(routeDirectory, 'components', 'SkuAccuracyTable.tsx'), 'utf8')
    expect(table).toMatch(/TableCaption/)
    expect(table).toMatch(/Точность по SKU — модель/)
    const detail = readFileSync(join(routeDirectory, 'components', 'SkuAccuracyDetail.tsx'), 'utf8')
    expect(detail).toMatch(/TableCaption/)
    expect(detail).toMatch(/История оценок — артикул/)
  })

  it('tabular-nums pin: numeric cells align (nmId stays non-tabular — opaque ID)', () => {
    const table = readFileSync(join(routeDirectory, 'components', 'SkuAccuracyTable.tsx'), 'utf8')
    expect(table).toMatch(/tabular-nums/)
    const detail = readFileSync(join(routeDirectory, 'components', 'SkuAccuracyDetail.tsx'), 'utf8')
    expect(detail).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level p-6/px-6/pt-6 (layout already provides p-4 lg:p-6)', () => {
    // page shell: breadcrumb + h1 previously carried their own route paddings
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b/)
    // component shells: skeletons/alerts/wrappers (stat-card p-4 is component-internal, allowed)
    for (const name of [
      'SkuAccuracyDetail.tsx',
      'SkuAccuracyOverview.tsx',
      'SkuAccuracyTable.tsx',
    ]) {
      const src = readFileSync(join(routeDirectory, 'components', name), 'utf8')
      // r-LOW hardening (171.8 review): same axis variants banned as on the page.
      expect(src, name).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
    }
  })
})
