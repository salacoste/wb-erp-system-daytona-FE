/**
 * Story 171.9 micro-guards — model performance detail route (owned surface ONLY:
 * performance page.tsx + components tree; registry/evaluations trees belong to
 * Stories 171.6-171.8). no-palette/no-hex over the 5 production files (this is
 * the epic-171 subroute that actually carried palette + chart hex); drift/valence
 * status-token pins; chart CSS-variable pins (171.4 canon); detach pin; caption
 * pin; tabular pin; padding pin. 169.11 regex canon (letter-lookahead, prose-exempt hex).
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
      // Anchor-safe (171.8 lesson): filter RELATIVE entries BEFORE join — substring
      // filters on joined absolute paths also match the checkout/worktree name.
      .filter(f => !f.includes('__tests__'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 171.9 route presentation source contracts', () => {
  it('production catalog pinned (5 files)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(5)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith(join('performance', 'page.tsx')))).toBe(true)
    expect(files.some(f => f.endsWith('ModelPerformanceDetail.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('MapeTrendChart.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('EvaluationHistoryTable.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('model-performance-helpers.ts'))).toBe(true)
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

  it('status-token pin: drift badges + MAPE-delta valence use semantic status tokens', () => {
    const helpers = readFileSync(
      join(routeDirectory, 'components', 'model-performance-helpers.ts'),
      'utf8'
    )
    expect(helpers).toMatch(/DRIFT_BADGE_CONFIG[\s\S]*status-success/)
    expect(helpers).toMatch(/DRIFT_BADGE_CONFIG[\s\S]*status-information/)
    expect(helpers).toMatch(/DRIFT_BADGE_CONFIG[\s\S]*status-error/)
    expect(helpers).toMatch(/text-status-success/)
    expect(helpers).toMatch(/text-status-error/)
    expect(helpers).not.toMatch(/text-green-600|text-red-600/)
  })

  it('chart-token pin: MapeTrendChart uses theme-aware CSS variables (171.4 canon)', () => {
    const chart = readFileSync(join(routeDirectory, 'components', 'MapeTrendChart.tsx'), 'utf8')
    expect(chart).toMatch(/var\(--color-border\)/)
    expect(chart).toMatch(/var\(--color-chart-axis\)/)
    expect(chart).toMatch(/var\(--color-chart-1\)/)
  })

  it('detach pin: detail no longer reads the shared registry overlay field', () => {
    const detail = readFileSync(
      join(routeDirectory, 'components', 'ModelPerformanceDetail.tsx'),
      'utf8'
    )
    expect(detail).toMatch(/PERFORMANCE_STATUS_BADGE_CLASS\[model\.status\]/)
    expect(detail).toMatch(/STATUS_BADGE_CONFIG\[model\.status\]\.label/)
    // Story 174.2 removed the registry className field outright — this pin now
    // guards against reintroduction.
    expect(detail).not.toMatch(/statusBadge\.className|STATUS_BADGE_CONFIG\[[^\]]*\]\.className/)
  })

  it('caption pin: history table names the model (RTC contract, 169.7 spec-order canon)', () => {
    const table = readFileSync(
      join(routeDirectory, 'components', 'EvaluationHistoryTable.tsx'),
      'utf8'
    )
    expect(table).toMatch(/TableCaption/)
    const detail = readFileSync(
      join(routeDirectory, 'components', 'ModelPerformanceDetail.tsx'),
      'utf8'
    )
    expect(detail).toMatch(/captionText=\{`История оценок/)
  })

  it('tabular-nums pin: numeric cells align', () => {
    const table = readFileSync(
      join(routeDirectory, 'components', 'EvaluationHistoryTable.tsx'),
      'utf8'
    )
    expect(table).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level p-6 (dashboard layout provides its own outer padding)', () => {
    const detail = readFileSync(
      join(routeDirectory, 'components', 'ModelPerformanceDetail.tsx'),
      'utf8'
    )
    expect(detail).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
  })
})
