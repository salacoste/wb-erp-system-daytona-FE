/**
 * Story 171.6 micro-guards — model registry root route (owned surface ONLY:
 * page.tsx + 3 components; [id]/** subroutes belong to Stories 171.7-171.9).
 * no-palette/no-hex over the 4 production files; status-token pins; caption pin.
 * 169.11 regex canon (letter-lookahead, #197 prose-exempt).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function productionFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => join(routeDirectory, f as string))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      // [id]/** dynamic subroutes are NOT part of Story 171.6's owned surface.
      .filter(f => !f.includes('[id]'))
      .filter(f => !f.includes('__tests__'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 171.6 route presentation source contracts', () => {
  it('production catalog pinned (4 files, [id]/** excluded)', () => {
    const files = productionFiles()
    expect(files).toHaveLength(4)
    // self-check: catalog is real
    expect(files.some(f => f.endsWith('ModelListSection.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith('model-list-helpers.ts'))).toBe(true)
    expect(files.some(f => f.endsWith('TrainModelButton.tsx'))).toBe(true)
    expect(files.some(f => f.endsWith(join('models', 'page.tsx')))).toBe(true)
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted #EEEEEE caught, #197 prose exempt)', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of productionFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('status-token pin: STATUS_BADGE_CONFIG uses semantic status tokens (palette eliminated)', () => {
    const helpers = readFileSync(
      join(routeDirectory, 'components', 'model-list-helpers.ts'),
      'utf8'
    )
    expect(helpers).toMatch(/text-status-success/)
    expect(helpers).toMatch(/text-status-information/)
    expect(helpers).toMatch(/text-status-warning/)
    expect(helpers).toMatch(/text-status-error/)
    expect(helpers).not.toMatch(/bg-green-100|bg-blue-100|bg-amber-100|bg-red-100|bg-gray-100/)
  })

  it('pulse-dot pin: training pulse uses status-information (171.4 StatusDot canon)', () => {
    const list = readFileSync(join(routeDirectory, 'components', 'ModelListSection.tsx'), 'utf8')
    expect(list).toMatch(/bg-status-information/)
    expect(list).not.toMatch(/bg-blue-500/)
  })

  it('caption + tabular-nums pins: table names itself; numeric cells align', () => {
    const list = readFileSync(join(routeDirectory, 'components', 'ModelListSection.tsx'), 'utf8')
    expect(list).toMatch(/TableCaption/)
    expect(list).toMatch(/Список ML-моделей вашего кабинета/)
    expect(list).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level p-6 (layout already provides p-4 lg:p-6)', () => {
    const list = readFileSync(join(routeDirectory, 'components', 'ModelListSection.tsx'), 'utf8')
    expect(list).not.toMatch(/\bp-6\b/)
  })
})
