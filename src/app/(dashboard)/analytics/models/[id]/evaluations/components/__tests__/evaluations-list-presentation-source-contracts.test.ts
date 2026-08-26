/**
 * Story 171.7 micro-guards — model evaluations list route (owned surface ONLY:
 * page.tsx + components tree; nested sku-accuracy/** belongs to Story 171.8).
 * no-palette/no-hex over the 5 production files; status-token detach pin (the
 * shared registry badge overlay field is no longer read here); caption pin;
 * tabular-nums pin; route-padding pin.
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
      // Anchor-safe (171.8 fix): filter RELATIVE segments BEFORE join — the plan-pinned
      // 171.8 worktree name itself contains the sku-accuracy substring, so a joined
      // absolute-path substring filter matched every file and emptied the catalog.
      .filter(f => !f.includes('sku-accuracy'))
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

describe('Story 171.7 route presentation source contracts', () => {
  it('production catalog pinned (5 files, sku-accuracy/** excluded)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(5)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith(join('evaluations', 'page.tsx')))).toBe(true)
    expect(files.some(f => f.endsWith('EvaluationsList.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('EvaluationsHeaderCard.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('EvaluationsTable.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('evaluations-list-helpers.ts'))).toBe(true)
    // sku-accuracy/** must never leak into the catalog (Story 171.8's surface).
    // Anchor-safe: the joined path segment, not a bare substring — the 171.8 worktree
    // name itself carries the sku-accuracy substring (same lesson as productionFiles()).
    expect(files.every(f => !f.includes(join('evaluations', 'sku-accuracy')))).toBe(true)
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

  it('status-token pin: route-local badge map uses semantic status tokens', () => {
    const helpers = readFileSync(
      join(routeDirectory, 'components', 'evaluations-list-helpers.ts'),
      'utf8'
    )
    expect(helpers).toMatch(/EVALUATION_STATUS_BADGE_CLASS/)
    expect(helpers).toMatch(/text-status-success/)
    expect(helpers).toMatch(/text-status-information/)
    expect(helpers).toMatch(/text-status-warning/)
    expect(helpers).toMatch(/text-status-error/)
  })

  it('detach pin: header card no longer reads the shared registry overlay field', () => {
    const header = readFileSync(
      join(routeDirectory, 'components', 'EvaluationsHeaderCard.tsx'),
      'utf8'
    )
    // Badge overlay resolved via the route-local map…
    expect(header).toMatch(/EVALUATION_STATUS_BADGE_CLASS\[model\.status\]/)
    // …and the shared config is only consulted for its label (single label source).
    expect(header).toMatch(/STATUS_BADGE_CONFIG\[model\.status\]\.label/)
    expect(header).not.toMatch(/statusBadge\.className/)
    // r-LOW hardening (171.7 review): ban ANY re-coupling to the overlay field,
    // not just the old local-variable spelling.
    expect(header).not.toMatch(/STATUS_BADGE_CONFIG\[[^\]]*\]\.className/)
  })

  it('caption pin: table names the model (RTC contract, 169.7 spec-order canon)', () => {
    const table = readFileSync(join(routeDirectory, 'components', 'EvaluationsTable.tsx'), 'utf8')
    expect(table).toMatch(/TableCaption/)
    const list = readFileSync(join(routeDirectory, 'components', 'EvaluationsList.tsx'), 'utf8')
    expect(list).toMatch(/captionText=\{`Оценки точности модели/)
  })

  it('tabular-nums pin: numeric cells align (nmId stays non-tabular — opaque ID)', () => {
    const table = readFileSync(join(routeDirectory, 'components', 'EvaluationsTable.tsx'), 'utf8')
    expect(table).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level p-6 (layout already provides p-4 lg:p-6)', () => {
    const list = readFileSync(join(routeDirectory, 'components', 'EvaluationsList.tsx'), 'utf8')
    expect(list).not.toMatch(/\bp-6\b/)
  })
})
