/**
 * Story 172.1 micro-guards — business dashboard route tree (owned surface ONLY:
 * src/app/(dashboard)/dashboard/**; widget tree lives in
 * dashboard-widgets-presentation-source-contracts). Catalog pinned to the 15
 * production files; no-palette/no-hex over the catalog; severity/status-banner
 * token pins; page padding pin. 169.11 regex canon (contextual, prose-exempt hex);
 * anchor-safe relative-first enumeration (171.8 lesson).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.1 route presentation source contracts', () => {
  it('production catalog pinned (15 files)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(15)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith(join('dashboard', 'page.tsx')))).toBe(true)
    expect(files.some(f => f.endsWith('DashboardContent.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('DashboardStatusStrip.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('DashboardAlerts.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('ReportPendingBanner.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('DashboardLazyCharts.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('useDashboardData.ts'))).toBe(true)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#F5F5F5'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('status-strip pin: severity tones use semantic status tokens', () => {
    const strip = readFileSync(
      join(routeDirectory, 'components', 'DashboardStatusStrip.tsx'),
      'utf8'
    )
    expect(strip).toMatch(/SEVERITY_META[\s\S]*status-error/)
    expect(strip).toMatch(/SEVERITY_META[\s\S]*status-information/)
    expect(strip).toMatch(/SEVERITY_META[\s\S]*status-warning/)
  })

  it('banner pin: alerts and pending banner use status-token tint idiom', () => {
    const alerts = readFileSync(join(routeDirectory, 'components', 'DashboardAlerts.tsx'), 'utf8')
    expect(alerts).toMatch(/border-status-information\/40/)
    expect(alerts).toMatch(/bg-status-information\/10/)
    const pending = readFileSync(
      join(routeDirectory, 'components', 'ReportPendingBanner.tsx'),
      'utf8'
    )
    expect(pending).toMatch(/status-warning/)
  })

  it('padding pin: no route-level outer padding on the dashboard shell (layout provides it)', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
    const content = readFileSync(join(routeDirectory, 'components', 'DashboardContent.tsx'), 'utf8')
    expect(content).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
  })
})
