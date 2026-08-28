/**
 * Story 172.10 micro-guards — Finances & Documents (owned surface: the
 * /finances route tree only; hooks/API/types/lib are forbidden shared files).
 * Catalog pinned (8 route prod files, per-file identity); no-palette/no-hex
 * over the catalog; semantic-token contract pins (RTC caption render-shape,
 * named downloads + pending status announcement + sr-only error alert,
 * destructive error alerts, AP#8 nullable currency passthrough);
 * tabular-nums; route-level padding pin. 169.11 regex canon; anchor-safe
 * relative-first enumeration (171.8/172.3 lessons).
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

describe('Story 172.10 finances presentation source contracts', () => {
  it('catalog pinned (8 route files, per-file identity)', () => {
    const route = routeProdFiles()
    expect(route).toHaveLength(8)
    // Exact relative-path equality (not endsWith superstrings — pass-1 review):
    // a rename to OldDocumentsTable.tsx must FAIL this pin, not satisfy it.
    const expected = [
      'components/BalanceCard.tsx',
      'components/DocumentDownloadButton.tsx',
      'components/DocumentsBody.tsx',
      'components/DocumentsFilters.tsx',
      'components/DocumentsPagination.tsx',
      'components/DocumentsTable.tsx',
      'error.tsx',
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

  it('caption pin: documents table renders RTC caption conditionally (render-shape)', () => {
    // Render-shape lives in DocumentsBody since the Story 172.10 max-lines
    // extraction (DocumentsTable threads the prop through).
    expect(readFileSync(component('DocumentsBody.tsx'), 'utf8')).toMatch(
      /captionText \? <TableCaption>/
    )
    expect(readFileSync(component('DocumentsTable.tsx'), 'utf8')).toMatch(/captionText=/)
    expect(readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')).toMatch(
      /captionText="Финансовые документы Wildberries"/
    )
  })

  it('download pin: named control, pending announcement, sr-only error alert', () => {
    const src = readFileSync(component('DocumentDownloadButton.tsx'), 'utf8')
    expect(src).toMatch(/aria-label=\{`Скачать документ \(\$\{extension\.toUpperCase\(\)\}\)`\}/)
    expect(src).toMatch(/role="status"/)
    expect(src).toMatch(/Скачивание документа…/)
    expect(src).toMatch(/role="alert"/)
    expect(src).toMatch(/mutation\.isSuccess && mutation\.data === false/)
    expect(src).toMatch(/Не удалось скачать/)
    // Icons are decorative (aria-hidden) — the button label carries the name.
    expect(src).toMatch(/<Loader2[^>]*aria-hidden/)
    expect(src).toMatch(/<AlertCircle[^>]*aria-hidden/)
    expect(src).toMatch(/<Download[^>]*aria-hidden/)
  })

  it('valence pin: both error branches are destructive alerts with retry', () => {
    for (const name of ['BalanceCard.tsx', 'DocumentsBody.tsx']) {
      const src = readFileSync(component(name), 'utf8')
      expect(src, `${name} destructive`).toMatch(/<Alert variant="destructive">/)
      expect(src, `${name} retry`).toMatch(/Повторить/)
    }
  })

  it('AP#8 pin: nullable balance money passes null through, never 0', () => {
    const src = readFileSync(component('BalanceCard.tsx'), 'utf8')
    expect(src).toMatch(/formatNullableCurrency\(balance\?\.current \?\? null\)/)
    expect(src).toMatch(/formatNullableCurrency\(balance\?\.forWithdraw \?\? null\)/)
    expect(src).toMatch(/Данные о балансе пока недоступны/)
  })

  it('tabular-nums pin: dates and money align digits', () => {
    expect(readFileSync(component('DocumentsBody.tsx'), 'utf8')).toMatch(/tabular-nums/)
    expect(readFileSync(component('BalanceCard.tsx'), 'utf8')).toMatch(/tabular-nums/)
    expect(readFileSync(component('DocumentsPagination.tsx'), 'utf8')).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
  })

  it('route error pin: accessible Russian recovery state with reset', () => {
    const src = readFileSync(join(routeDirectory, 'error.tsx'), 'utf8')
    expect(src).toMatch(/role="alert"/)
    expect(src).toMatch(/Не удалось открыть финансы/)
    expect(src).toMatch(/onClick=\{reset\}/)
  })
})
