/**
 * Story 171.5 micro-guards — born-token-clean route (single amber site migrated);
 * no-palette/no-hex over the 5 production files; warning-token pin; caption pins.
 * 169.11 regex canon (letter-lookahead, #197 prose-exempt).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function productionFiles(): string[] {
  return readdirSync(routeDirectory, { recursive: true })
    .map(f => join(routeDirectory, f as string))
    .filter(f => /\.(?:ts|tsx)$/.test(f))
    .filter(f => !f.includes('__tests__'))
    .filter(f => !/\.(?:test|spec)\./.test(f))
    .sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 171.5 route presentation source contracts', () => {
  it('production catalog pinned (5 files)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(5)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith('HorizonBreakdownTable.tsx'))).toBe(true)
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

  it('warning-token pin: high-MAPE band uses status-warning (amber eliminated)', () => {
    const cards = readFileSync(
      join(routeDirectory, 'components', 'AccuracyMetricsCards.tsx'),
      'utf8'
    )
    expect(cards).toMatch(/text-status-warning/)
    expect(cards).not.toMatch(/text-amber-600/)
  })

  it('caption pins: both tables name their analysis', () => {
    const h = readFileSync(join(routeDirectory, 'components', 'HorizonBreakdownTable.tsx'), 'utf8')
    const s = readFileSync(join(routeDirectory, 'components', 'SkuBreakdownTable.tsx'), 'utf8')
    expect(h).toMatch(/Точность прогнозов по горизонтам/)
    expect(s).toMatch(/Точность прогнозов по SKU/)
    expect(h).toMatch(/tabular-nums/)
    expect(s).toMatch(/tabular-nums/)
  })
})
