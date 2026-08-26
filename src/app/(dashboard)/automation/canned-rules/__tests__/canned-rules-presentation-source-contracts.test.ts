/**
 * Story 172.2 micro-guards — canned automation rules gallery (owned surface:
 * this route tree's page.tsx + the exclusive CannedRulesGallery widget; the
 * installed-rules tree belongs to Story 172.3). Catalog pinned to the route
 * production file; no-palette/no-hex over page + gallery; primitive pins
 * (retry on Button, no raw button element); double-padding pin; badge pin
 * (price warning destructive, text not color-only); Dialog a11y pin.
 * 169.11 regex canon (contextual, prose-exempt hex); anchor-safe
 * relative-first enumeration (171.8 lesson).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const galleryFile = join(
  routeDirectory,
  '..',
  '..',
  '..',
  '..',
  'components',
  'custom',
  'automation',
  'CannedRulesGallery.tsx'
)

function productionFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8 lesson): filter RELATIVE entries BEFORE join.
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

describe('Story 172.2 canned-rules presentation source contracts', () => {
  it('production catalog pinned (1 route file; gallery widget pinned by path)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(1)
    expect(files.some(f => f.endsWith(join('canned-rules', 'page.tsx')))).toBe(true)
  })

  it('no legacy palette classes in page or gallery', () => {
    for (const f of [...productionFiles(), galleryFile]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#F5F5F5'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of [...productionFiles(), galleryFile]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('primitive pin: page error retry uses the Button primitive, no raw button element', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).toMatch(/import \{ Button \} from '@\/components\/ui\/button'/)
    expect(page).toMatch(/<Button[\s\S]*?canned-rules-retry/)
    expect(page).not.toMatch(/<button[\s>]/)
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b|\bp-4\b/)
  })

  it('badge pin: price warning is the destructive Badge with text meaning (not color-only)', () => {
    const gallery = readFileSync(galleryFile, 'utf8')
    expect(gallery).toMatch(/Badge variant="destructive"/)
    expect(gallery).toMatch(/Требует arm write-back/)
  })

  it('dialog a11y pin: rename Dialog has Title + Description (labelled dialog)', () => {
    const gallery = readFileSync(galleryFile, 'utf8')
    expect(gallery).toMatch(/DialogTitle/)
    expect(gallery).toMatch(/DialogDescription/)
    expect(gallery).toMatch(/htmlFor="canned-rename"/)
  })
})
