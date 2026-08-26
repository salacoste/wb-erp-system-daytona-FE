/**
 * Story 172.3 micro-guards — installed automation rules LIST (owned surface:
 * page.tsx + InstalledRulesPageContent + the InstalledRulesList/Row/
 * PostInstallBanner widgets; the dynamic editor subtree and its [id] shell
 * belong to Story 172.4). Catalog pinned to the 2 list-route production files;
 * no-palette/no-hex over route files + widgets; badge/warning/banner token
 * pins; padding pin. 169.11 regex canon (contextual, prose-exempt hex);
 * anchor-safe relative-first enumeration (171.8 lesson).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const widgetsDirectory = join(
  routeDirectory,
  '..',
  '..',
  '..',
  '..',
  'components',
  'custom',
  'automation'
)

function routeProductionFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8 lesson): filter RELATIVE entries BEFORE join.
      .filter(f => !f.includes('__tests__'))
      // editor/ subtree belongs to 172.4; [id] shell is the editor's entry.
      // Anchor-safe: filter on RELATIVE segments (readdir entries start with
      // 'editor/' / '[id]/'), never on joined absolute paths (171.8 lesson).
      .filter(f => f !== 'editor' && !f.startsWith('editor/'))
      .filter(f => f !== '[id]' && !f.startsWith('[id]/'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f))
      .sort()
  )
}

const widgetFiles = ['InstalledRulesList.tsx', 'InstalledRuleRow.tsx', 'PostInstallBanner.tsx'].map(
  f => join(widgetsDirectory, f)
)

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.3 installed-rules-list presentation source contracts', () => {
  it('route catalog pinned (2 list files; editor tree excluded — owned by 172.4)', () => {
    const files = routeProductionFiles()
    expect(files).toHaveLength(2)
    expect(files.some(f => f.endsWith('InstalledRulesPageContent.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith(join('installed-rules', 'page.tsx')))).toBe(true)
  })

  it('no legacy palette classes in route files or list widgets', () => {
    for (const f of [...routeProductionFiles(), ...widgetFiles]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#22C55E'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of [...routeProductionFiles(), ...widgetFiles]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const content = readFileSync(join(routeDirectory, 'InstalledRulesPageContent.tsx'), 'utf8')
    expect(content).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
  })

  it('badge pin: enabled badge uses the status-success tint idiom', () => {
    const row = readFileSync(join(widgetsDirectory, 'InstalledRuleRow.tsx'), 'utf8')
    expect(row).toMatch(/border-status-success\/40 bg-status-success\/10 text-status-success/)
  })

  it('warning pin: writeback safety block on status-warning (text meaning, not color-only)', () => {
    const row = readFileSync(join(widgetsDirectory, 'InstalledRuleRow.tsx'), 'utf8')
    expect(row).toMatch(/text-status-warning/)
    expect(row).toMatch(/Требует arm write-back/)
  })

  it('banner pin: post-install deep-link banner uses the success tint idiom', () => {
    const banner = readFileSync(join(widgetsDirectory, 'PostInstallBanner.tsx'), 'utf8')
    expect(banner).toMatch(/border-status-success\/40/)
    expect(banner).toMatch(/bg-status-success\/10/)
    expect(banner).toMatch(/text-status-success/)
  })
})
