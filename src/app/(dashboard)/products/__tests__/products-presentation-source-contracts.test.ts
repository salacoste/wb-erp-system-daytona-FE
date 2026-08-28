/**
 * Story 172.17 micro-guards — Product Management (owned surface: the
 * /products route tree + product-exclusive custom components). MINOR-GAP
 * closed (2 palette swaps); dual-root catalog pinned (1 route + 1 shared
 * prod file, per-file identity); no-palette/no-hex over both roots;
 * valence pin (error branches on status-error, RU strings); 169.11 regex
 * canon; anchor-safe relative-first enumeration.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sharedDirectory = resolve(routeDirectory, '../../../components/custom/products')

function prodFiles(root: string): string[] {
  return readdirSync(root, { recursive: true })
    .map(f => f as string)
    .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
    .filter(f => !/\.(?:test|spec)\./.test(f))
    .filter(f => /\.(?:ts|tsx)$/.test(f))
    .map(f => join(root, f))
    .sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 172.17 products presentation source contracts', () => {
  it('catalog pinned (1 route + 1 shared prod file, per-file identity)', () => {
    const route = prodFiles(routeDirectory).map(f =>
      f.slice(routeDirectory.length + 1).replace(/\\/g, '/')
    )
    expect(route).toEqual(['page.tsx'])
    const shared = prodFiles(sharedDirectory).map(f =>
      f.slice(sharedDirectory.length + 1).replace(/\\/g, '/')
    )
    expect(shared).toEqual(['BrandSubjectFilter.tsx'])
  })

  it('no legacy palette classes in any production file (both roots)', () => {
    for (const f of [...prodFiles(routeDirectory), ...prodFiles(sharedDirectory)]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of [...prodFiles(routeDirectory), ...prodFiles(sharedDirectory)]) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('valence pin: both error branches on status-error (RU strings frozen)', () => {
    const src = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(src.match(/className="text-status-error"/g)).toHaveLength(2)
    expect(src).toMatch(/Ошибка загрузки списка\./)
    expect(src).toMatch(/Ошибка загрузки подсказок\./)
  })
})
