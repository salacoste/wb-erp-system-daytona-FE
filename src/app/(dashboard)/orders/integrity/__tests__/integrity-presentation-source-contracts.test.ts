/**
 * Story 172.16 micro-guards — Order Integrity Analysis (owned surface: the
 * /orders/integrity route tree only). MINOR-GAP closed (6 palette swaps);
 * catalog pinned (6 route prod files, per-file identity); no-palette/no-hex
 * over the catalog; valence pins (status/warn/fail on status tokens, RU
 * labels carry meaning); 169.11 regex canon; anchor-safe enumeration.
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

describe('Story 172.16 integrity presentation source contracts', () => {
  it('catalog pinned (6 route files, per-file identity)', () => {
    const route = routeProdFiles()
    const expected = [
      'components/IntegrityChecksGrid.tsx',
      'components/IntegrityStatusCard.tsx',
      'components/OrdersIntegrityPageContent.tsx',
      'components/ReconciliationSection.tsx',
      'loading.tsx',
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

  it('no hex color literals (self-tested regex)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of routeProdFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('status card pin: ok/warn/fail valence on status tokens (RU labels)', () => {
    const src = readFileSync(component('IntegrityStatusCard.tsx'), 'utf8')
    expect(src).toMatch(/'text-status-success'/)
    expect(src).toMatch(/'text-status-warning'/)
    expect(src).toMatch(/'text-status-error'/)
  })

  it('checks grid pin: pass/warn/fail map with icon + token + RU label', () => {
    const src = readFileSync(component('IntegrityChecksGrid.tsx'), 'utf8')
    expect(src).toMatch(/pass: \{ icon: CheckCircle2, color: 'text-status-success', label: 'OK' \}/)
    expect(src).toMatch(
      /warn: \{ icon: AlertTriangle, color: 'text-status-warning', label: 'Внимание' \}/
    )
    expect(src).toMatch(/fail: \{ icon: XCircle, color: 'text-status-error', label: 'Ошибка' \}/)
  })
})
