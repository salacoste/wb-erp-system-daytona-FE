/**
 * Story 172.12 micro-guards — Monitoring operations console (owned surface:
 * the /monitoring route tree only; monitoring APIs/hooks-in-src/hooks/types
 * are shared per plan; src/lib is forbidden). Catalog pinned (29 route prod
 * files, per-file identity); no-palette/no-hex over the catalog; semantic
 * contract pins (heatmap STATUS color map incl. color-mix recovered,
 * status/severity banner shapes, completeness badge/bar tokens, pipeline
 * rate-bar valence ternary, empty-state tokens, telegram config tokens);
 * 169.11 regex canon; anchor-safe relative-first enumeration.
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

describe('Story 172.12 monitoring presentation source contracts', () => {
  it('catalog pinned (29 route files, per-file identity)', () => {
    const route = routeProdFiles()
    // Exact relative-path equality (172.10/172.11 canon): rename/add/remove
    // must FAIL this pin.
    const expected = [
      'components/CompletenessRow.tsx',
      'components/DataCompletenessTable.tsx',
      'components/HealthHistoryChart.tsx',
      'components/HealthReportSheet.tsx',
      'components/HealthReportSheetBody.tsx',
      'components/HealthScoreWidget.tsx',
      'components/HeatmapCell.tsx',
      'components/HeatmapTooltip.tsx',
      'components/MonitoringEmptyState.tsx',
      'components/MonitoringPageContent.tsx',
      'components/PipelineHeatmap.tsx',
      'components/PipelineHeatmapSubcomponents.tsx',
      'components/PipelineStatusGrid.tsx',
      'components/RecoveryPanel.tsx',
      'components/RecoveryPanelSubcomponents.tsx',
      'components/TelegramStatusCard.tsx',
      'components/data-completeness-constants.ts',
      'components/health-history-helpers.ts',
      'components/health-report-utils.ts',
      'components/heatmap-constants.ts',
      'hooks/use-monitoring-dashboard.ts',
      'hooks/use-pipeline-grid.ts',
      'hooks/use-recovery.ts',
      'page.tsx',
      'types/monitoring-enums.ts',
      'types/monitoring-grid.ts',
      'types/monitoring-reports.ts',
      'types/monitoring-telegram.ts',
      'types/monitoring.ts',
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

  it('heatmap status map pin: CSS-var valence + color-mix recovered (distinct from success)', () => {
    const src = readFileSync(component('HeatmapCell.tsx'), 'utf8')
    // Per-key anchors (pass-1 review): the recovered color-mix line also
    // contains chart-positive — a bare token match is not unique.
    expect(src).toMatch(/success: 'var\(--color-chart-positive\)'/)
    expect(src).toMatch(/partial: 'var\(--color-status-warning\)'/)
    expect(src).toMatch(/failed: 'var\(--color-chart-negative\)'/)
    expect(src).toMatch(/missed: 'var\(--color-muted-foreground\)'/)
    // recovered stays positive-valence but visually distinct from success
    // (plain token would collide — all greens share one HSL triple).
    expect(src).toMatch(/color-mix\(in srgb, var\(--color-chart-positive\) 60%, transparent\)/)
  })

  it('legend sync pin: heatmap-constants carries the same 7 semantic colors', () => {
    // Pass-1 review finding #2: the cell map and LEGEND_ITEMS are separate
    // literals — drift between them passed green until this pin. LEGEND_ITEMS
    // uses { color, label } entries.
    const src = readFileSync(component('heatmap-constants.ts'), 'utf8')
    expect(src).toMatch(/\{ color: 'var\(--color-chart-positive\)', label: 'Успешно' \}/)
    expect(src).toMatch(/\{ color: 'var\(--color-status-warning\)', label: 'Частично' \}/)
    expect(src).toMatch(/\{ color: 'var\(--color-chart-negative\)', label: 'Ошибка' \}/)
    expect(src).toMatch(/\{ color: 'var\(--color-muted-foreground\)', label: 'Пропущено' \}/)
    expect(src).toMatch(/\{ color: 'var\(--color-muted\)', label: 'Нет данных', border: true \}/)
    expect(src).toMatch(/\{ color: 'var\(--color-status-information\)', label: 'В процессе' \}/)
    expect(src).toMatch(
      /color: 'color-mix\(in srgb, var\(--color-chart-positive\) 60%, transparent\)',/
    )
  })

  it('severity banner pin: healthy/degraded/critical + critical/warning/info on status tokens', () => {
    const sheet = readFileSync(component('HealthReportSheet.tsx'), 'utf8')
    expect(sheet).toMatch(/bg-status-success\/10 text-status-success border-status-success\/40/)
    expect(sheet).toMatch(/bg-status-warning\/10 text-status-warning border-status-warning\/40/)
    expect(sheet).toMatch(/bg-status-error\/10 text-status-error border-status-error\/40/)
    const body = readFileSync(component('HealthReportSheetBody.tsx'), 'utf8')
    expect(body).toMatch(/bg-status-information\/10 text-status-information/)
  })

  it('completeness pin: badge + bar + label on status tokens', () => {
    const src = readFileSync(component('data-completeness-constants.ts'), 'utf8')
    expect(src).toMatch(/border-status-success text-status-success/)
    expect(src).toMatch(/border-status-warning text-status-warning/)
    expect(src).toMatch(/border-status-error text-status-error/)
    expect(src).toMatch(/\[\&>div\]:bg-status-success/)
    expect(src).toMatch(/\[\&>div\]:bg-status-warning/)
    expect(src).toMatch(/\[\&>div\]:bg-status-error/)
  })

  it('pipeline rate-bar pin: 90/70 thresholds on status tokens', () => {
    expect(readFileSync(component('PipelineStatusGrid.tsx'), 'utf8')).toMatch(
      /rate >= 90 \? 'bg-status-success' : rate >= 70 \? 'bg-status-warning' : 'bg-status-error'/
    )
  })

  it('empty-state + page pins: muted/foreground tokens, destructive error retry', () => {
    const empty = readFileSync(component('MonitoringEmptyState.tsx'), 'utf8')
    expect(empty).toMatch(/bg-muted/)
    expect(empty).toMatch(/text-muted-foreground/)
    expect(empty).toMatch(/text-foreground/)
    const page = readFileSync(component('MonitoringPageContent.tsx'), 'utf8')
    expect(page).toMatch(/text-status-error/)
    expect(page).toMatch(/var\(--color-primary\)/)
  })

  it('telegram pin: config + rate colors on status tokens', () => {
    const card = readFileSync(component('TelegramStatusCard.tsx'), 'utf8')
    expect(card).toMatch(/text-status-success/)
    expect(card).toMatch(/text-status-warning/)
    expect(card).toMatch(/text-status-error/)
    expect(card).toMatch(/text-muted-foreground/)
  })
})
