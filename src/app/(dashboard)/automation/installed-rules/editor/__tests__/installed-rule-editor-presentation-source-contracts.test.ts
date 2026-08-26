/**
 * Story 172.4 micro-guards — dynamic installed-rule editor (owned surface:
 * editor/** + the [id] route shell; the list route belongs to 172.3).
 * Catalog pinned to the 8 production files; no-palette/no-hex over the
 * catalog; success-alert + writeback-safety token pins; back-affordance
 * primitive pin; padding pin. 169.11 regex canon (contextual, prose-exempt
 * hex); anchor-safe relative-first enumeration (171.8/172.3 lesson:
 * separator-anchored prefix filters + per-file catalog identity).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const editorDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const routeDirectory = resolve(editorDirectory, '..')

function productionFiles(): string[] {
  const editorFiles = readdirSync(editorDirectory, { recursive: true })
    .map(f => f as string)
    // Anchor-safe (171.8/172.3 lesson): filter RELATIVE entries BEFORE join;
    // separator-anchored exclusion covers nested test dirs too (review pass-1).
    .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
    .filter(f => !/\.(?:test|spec)\./.test(f))
    .filter(f => /\.(?:ts|tsx)$/.test(f))
    .map(f => join(editorDirectory, f))
  const shell = join(routeDirectory, '[id]', 'page.tsx')
  return [...editorFiles, shell].sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.4 installed-rule-editor presentation source contracts', () => {
  it('production catalog pinned (7 editor files + [id] shell)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(8)
    for (const name of [
      'InstalledRuleEditor.tsx',
      'EditorFields.tsx',
      'UnsavedChangesGuard.tsx',
      'WritebackSafetyAcknowledgement.tsx',
      'editor-states.tsx',
      'validation.ts',
      'form-controls.tsx',
    ]) {
      expect(
        files.some(f => f.endsWith(name)),
        name
      ).toBe(true)
    }
    expect(files.some(f => f.endsWith(join('[id]', 'page.tsx')))).toBe(true)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('success-alert pin: update-success Alert uses the status-success tint idiom', () => {
    const editor = readFileSync(join(editorDirectory, 'InstalledRuleEditor.tsx'), 'utf8')
    expect(editor).toMatch(/border-status-success\/40 bg-status-success\/10 text-status-success/)
  })

  it('writeback-safety pin: acknowledgement panel on status-warning tokens', () => {
    const safety = readFileSync(join(editorDirectory, 'WritebackSafetyAcknowledgement.tsx'), 'utf8')
    expect(safety).toMatch(/border-status-warning\/40/)
    expect(safety).toMatch(/bg-status-warning\/10/)
    expect(safety).toMatch(/text-status-warning/)
  })

  it('back-affordance pin: editor back control is the Button primitive, no raw button anywhere', () => {
    const editor = readFileSync(join(editorDirectory, 'InstalledRuleEditor.tsx'), 'utf8')
    expect(editor).toMatch(/<Button[^>]*data-testid="editor-back"/)
    // Catalog-wide: the affordance must not reappear as a raw button in any
    // editor file (review pass-1 hardening).
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/<button[\s>]/)
    }
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const editor = readFileSync(join(editorDirectory, 'InstalledRuleEditor.tsx'), 'utf8')
    expect(editor).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
  })
})
