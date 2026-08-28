/**
 * Story 172.11 micro-guards — Monitor route (owned surface: the /monitor
 * route tree only; monitoring APIs/hooks/types/lib are forbidden shared
 * files). Catalog pinned (14 route prod files, per-file identity);
 * no-palette/no-hex over the catalog; semantic-token contract pins (health
 * band valence via CSS vars + status text tokens, stale/partial/degraded
 * banner shapes, destructive error banner, negative-margin valence, delta
 * colorClass, weekly-chart series/grid tokens); 169.11 regex canon;
 * anchor-safe relative-first enumeration (171.8/172.3 lessons).
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

describe('Story 172.11 monitor presentation source contracts', () => {
  it('catalog pinned (14 route files, per-file identity)', () => {
    const route = routeProdFiles()
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin.
    const expected = [
      'components/MonitorBuyoutGauge.tsx',
      'components/MonitorKpiCards.tsx',
      'components/MonitorMetricsTable.tsx',
      'components/MonitorPageContent.tsx',
      'components/MonitorPipelineHealth.tsx',
      'components/MonitorWeeklyChart.tsx',
      'components/monitor-metrics-config.ts',
      'components/monitor-metrics-utils.ts',
      'components/monitor-pipeline-utils.ts',
      'components/monitor-weekly-chart-tooltip.tsx',
      'components/monitor-weekly-chart-utils.ts',
      'hooks/use-monitor-summary.ts',
      'page.tsx',
      'types/monitor-summary.ts',
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

  it('health band pin: CSS-var valence colors + status text tokens (exact map)', () => {
    const src = readFileSync(component('monitor-pipeline-utils.ts'), 'utf8')
    expect(src).toMatch(/'var\(--color-muted-foreground\)'/)
    expect(src).toMatch(/'var\(--color-chart-positive\)'/)
    expect(src).toMatch(/'var\(--color-status-warning\)'/)
    expect(src).toMatch(/'var\(--color-chart-negative\)'/)
    // Per-band textClass tokens (no-data/success/warning/error bands).
    expect(src).toMatch(/textClass: 'text-muted-foreground'/)
    expect(src).toMatch(/textClass: 'text-status-success'/)
    expect(src).toMatch(/textClass: 'text-status-warning'/)
    expect(src).toMatch(/textClass: 'text-status-error'/)
  })

  it('banner pin: stale/partial warning shape, destructive error shape, foreground heading', () => {
    const src = readFileSync(component('MonitorPageContent.tsx'), 'utf8')
    expect(src).toMatch(/text-3xl font-bold tracking-tight text-foreground/)
    // Two warning banners (stale + partial): tokens counted separately — the
    // layout utilities (px-4 py-2 text-sm) sit between them in className.
    expect(src.match(/border-status-warning\/40 bg-status-warning\/10/g)).toHaveLength(2)
    expect(src.match(/text-sm text-status-warning/g)).toHaveLength(2)
    expect(src).toMatch(/border-destructive\/40 bg-destructive\/10/)
    expect(src).toMatch(/text-sm text-destructive/)
  })

  it('margin valence pin: negative margin reads as status-error', () => {
    expect(readFileSync(component('MonitorMetricsTable.tsx'), 'utf8')).toMatch(
      /value < 0 \? 'text-status-error' : ''/
    )
  })

  it('delta pin: improving/falling deltas on success/error tokens', () => {
    expect(readFileSync(component('monitor-metrics-utils.ts'), 'utf8')).toMatch(
      /improving \? 'text-status-success' : 'text-status-error'/
    )
  })

  it('chart series pin: weekly lines + grid on chart/status tokens (recharts var() idiom)', () => {
    const utils = readFileSync(component('monitor-weekly-chart-utils.ts'), 'utf8')
    expect(utils).toMatch(/sales: 'var\(--color-chart-1\)'/)
    expect(utils).toMatch(/orders: 'var\(--color-chart-positive\)'/)
    expect(utils).toMatch(/returns: 'var\(--color-status-warning\)'/)
    expect(readFileSync(component('MonitorWeeklyChart.tsx'), 'utf8')).toMatch(
      /stroke="var\(--color-chart-grid\)"/
    )
  })

  it('gauge pin: arc colors resolve via style, not SVG attributes', () => {
    const src = readFileSync(component('MonitorBuyoutGauge.tsx'), 'utf8')
    expect(src).toMatch(/style=\{\{ stroke: color \}\}/)
    expect(src).toMatch(/var\(--color-chart-grid\)/)
  })
})
