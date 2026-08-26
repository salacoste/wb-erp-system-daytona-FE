/**
 * Story 171.4-FE forecast presentation source contracts.
 *
 * Canon: 170.x guard suite (recursive no-palette/no-hex over the owned
 * production surface + explicit token pins, 170.1 3-branch hex regex with
 * self-tests). Owned production surface = 18 files post-migration:
 * page.tsx + 17 components/helpers (incl. the NEW ForecastChartSrTable added
 * for the sr-only data alternative). Tests are NOT part of the surface.
 */

import { readFileSync, readdirSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const here = (rel: string) => readFileSync(resolve(TEST_DIR, rel), 'utf8')

/** Owned production sources (exactly 18 files — Story 171.4 scope, post-migration). */
const OWNED_SOURCES: [string, string][] = [
  ['page.tsx', here('../../page.tsx')],
  ['ForecastChart.tsx', here('../ForecastChart.tsx')],
  ['ForecastChartSrTable.tsx', here('../ForecastChartSrTable.tsx')],
  ['forecast-chart-helpers.ts', here('../forecast-chart-helpers.ts')],
  ['ForecastTable.tsx', here('../ForecastTable.tsx')],
  ['ForecastMetrics.tsx', here('../ForecastMetrics.tsx')],
  ['ForecastPageContent.tsx', here('../ForecastPageContent.tsx')],
  ['ForecastPageHeader.tsx', here('../ForecastPageHeader.tsx')],
  ['ForecastParamsCard.tsx', here('../ForecastParamsCard.tsx')],
  ['ForecastReadyStates.tsx', here('../ForecastReadyStates.tsx')],
  ['ModelTypeSelector.tsx', here('../ModelTypeSelector.tsx')],
  ['readiness-router.ts', here('../readiness-router.ts')],
  ['forecast-query-helpers.ts', here('../forecast-query-helpers.ts')],
  ['AiEngineStatusBadge.tsx', here('../AiEngineStatusBadge.tsx')],
  ['AiPreferencesToggle.tsx', here('../AiPreferencesToggle.tsx')],
  ['CollectingProgressTracker.tsx', here('../CollectingProgressTracker.tsx')],
  ['SneakPreviewSection.tsx', here('../SneakPreviewSection.tsx')],
  ['TopSkusTable.tsx', here('../TopSkusTable.tsx')],
]

function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '')
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|scrollbar-thumb|scrollbar-track|decoration|outline|divide)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone|fuchsia|pink|violet|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

// Hex guard: 170.1 3-branch canon (quoted/arbitrary, after ':', unquoted inline-style).
const CONTEXTUAL_HEX = new RegExp(
  [
    String.raw`(?<!=\s*)(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])`,
    String.raw`(?<=:)\s*#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
    String.raw`(?<=\s)#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
  ].join('|')
)

const RGBA_HSL = /(?:rgba?\(|hsla?\()\s*\d/

const CHART = () => withoutComments(OWNED_SOURCES[1][1])
const TABLE = () => withoutComments(OWNED_SOURCES[4][1])
const SR_TABLE = () => withoutComments(OWNED_SOURCES[2][1])

describe('Story 171.4 forecast presentation source contracts', () => {
  it('owned production surface is exactly 18 files (pinned, post-migration incl. sr-table)', () => {
    expect(OWNED_SOURCES).toHaveLength(18)
    const root = resolve(TEST_DIR, '../..')
    const realFiles: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true }) as Dirent[]) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else if (/\.(tsx|ts)$/.test(entry.name) && !p.includes('__tests__')) realFiles.push(p)
      }
    }
    walk(root)
    expect(realFiles, realFiles.join(', ')).toHaveLength(18)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), name).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('owned production sources contain no raw hex literals or rgba()/hsl() colors', () => {
    for (const [name, source] of OWNED_SOURCES) {
      expect(withoutComments(source), `${name} hex`).not.toMatch(CONTEXTUAL_HEX)
      expect(withoutComments(source), `${name} rgba/hsl`).not.toMatch(RGBA_HSL)
    }
  })

  it('hex guard self-test: rejects color hex, exempts prose + URL fragments', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('fill: #ffffff')).toBe(true)
    expect(CONTEXTUAL_HEX.test('// Contract #219 covers this')).toBe(false)
    expect(CONTEXTUAL_HEX.test('href="#abc"')).toBe(false)
  })

  it('palette guard self-test: catches legacy utilities, exempts semantic tokens', () => {
    expect(LEGACY_PALETTE.test('text-green-600')).toBe(true)
    expect(LEGACY_PALETTE.test('bg-status-success/15')).toBe(false)
    expect(LEGACY_PALETTE.test('text-financial-positive')).toBe(false)
  })

  it('grid/axis token pin: border grid/axis lines + chart-axis ticks (169.4 canon)', () => {
    const chart = CHART()
    expect(chart).toMatch(/stroke="var\(--color-border\)"/)
    expect(chart).toMatch(/fill: 'var\(--color-chart-axis\)'/)
    expect(chart).not.toContain('#EEEEEE')
    expect(chart).not.toContain('#757575')
  })

  it('cutout-var pin (dark-FIX, r1-HIGH correction): band cutout uses var(--color-card) (CARD surface — background 3.9% painted a near-black slab over card 6.7% in dark), no #ffffff literal', () => {
    const chart = CHART()
    expect(chart).toMatch(
      /dataKey="bandUpper"[\s\S]*?fill="var\(--color-status-error\)"\s*\n\s*fillOpacity=\{0\.15\}/
    )
    expect(chart).toMatch(/dataKey="bandLower"[\s\S]*?fill="var\(--color-card\)"/)
    expect(chart).not.toContain('#ffffff')
    expect(chart).not.toContain('#E53935')
  })

  it('categorical decision pin: AI = chart-1 + naive = muted dashed (non-color marker kept)', () => {
    const chart = CHART()
    expect(chart).toMatch(/dataKey="predictedSales"[\s\S]*?stroke="var\(--color-chart-1\)"/)
    expect(chart).toMatch(/activeDot=\{\{ r: 4, fill: 'var\(--color-chart-1\)' \}\}/)
    expect(chart).toMatch(
      /dataKey="naiveBaseline"[\s\S]*?stroke="var\(--color-chart-axis\)"[\s\S]*?strokeDasharray="4 4"/
    )
    expect(chart).not.toContain('#9CA3AF')
  })

  it('band-tier-collapse pin: 3 distinct status pairs + Russian labels preserved', () => {
    const table = TABLE()
    expect(table).toMatch(/high:[\s\S]*?text-status-success bg-status-success\/15/)
    expect(table).toMatch(/medium:[\s\S]*?text-status-warning bg-status-warning\/15/)
    expect(table).toMatch(/low:[\s\S]*?text-status-error bg-status-error\/15/)
    expect(table).toContain('Высокая')
    expect(table).toContain('Средняя')
    expect(table).toContain('Низкая')
  })

  it('aiVsNaive valence pin: financial-positive/negative by sign prefix (169.4 canon)', () => {
    const table = TABLE()
    expect(table).toMatch(/startsWith\('\+'\)\) return 'text-financial-positive'/)
    expect(table).toMatch(/startsWith\('-'\)\) return 'text-financial-negative'/)
  })

  it('sr-alternative pin: chart renders sr-only table with every date, AI/naive + band', () => {
    expect(CHART()).toMatch(/<ForecastChartSrTable rows=\{chartData\} \/>/)
    const sr = SR_TABLE()
    expect(sr).toMatch(/className="sr-only"/)
    expect(sr).toMatch(/<caption>/)
    expect(sr).toMatch(/Прогноз \(AI\)/)
    expect(sr).toMatch(/Базовая оценка/)
    expect(sr).toMatch(/Диапазон/)
    expect(sr).toMatch(/нет данных/)
  })

  it('table RTC pin: static caption + scroll-region + tabular-nums numeric cells', () => {
    const table = TABLE()
    expect(table).toMatch(/role="region"/)
    expect(table).toMatch(/tabIndex=\{0\}/)
    expect(table).toMatch(/<caption[^>]*>Прогноз продаж<\/caption>/)
    expect(table).toMatch(/tabular-nums/)
  })

  it('StatusBadge solid-pin + valence sweep pins across collecting/sneak/header/toggle', () => {
    const badge = withoutComments(OWNED_SOURCES[13][1])
    expect(badge).toMatch(/bg-status-success/)
    expect(badge).toMatch(/bg-status-warning/)
    expect(badge).toMatch(/bg-status-error/)
    expect(badge).not.toMatch(/bg-(green|amber|red)-500/)
    const collecting = withoutComments(OWNED_SOURCES[15][1])
    expect(collecting).toMatch(/text-status-success/)
    expect(collecting).toMatch(/text-status-warning/)
    expect(collecting).toMatch(/text-status-information/)
    expect(collecting).toMatch(/Brain[^/]*text-muted-foreground/)
    expect(collecting).not.toMatch(/text-(purple|blue|amber|green)-[0-9]+/)
    const sneak = withoutComments(OWNED_SOURCES[16][1])
    expect(sneak).toMatch(/text-financial-positive/)
    expect(sneak).toMatch(/text-financial-negative/)
    const header = withoutComments(OWNED_SOURCES[7][1])
    expect(header).toMatch(/text-muted-foreground"/)
    expect(header).not.toMatch(/text-purple-600/)
    const toggle = withoutComments(OWNED_SOURCES[14][1])
    expect(toggle).toMatch(/text-status-warning/)
  })
})
