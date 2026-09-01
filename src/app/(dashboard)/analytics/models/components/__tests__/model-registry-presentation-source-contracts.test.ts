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
      .map(f => f as string)
      // Anchor-safe (171.8 lesson, hardened by Story 174.2): filter RELATIVE entries
      // BEFORE join — substring filters on joined absolute paths also match the
      // checkout/worktree name.
      // [id]/** dynamic subroutes are NOT part of Story 171.6's owned surface.
      .filter(f => !f.includes('[id]'))
      .filter(f => !f.includes('__tests__'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f))
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

  it('status-token pin: badge map uses contrast-safe solid semantic pairs', () => {
    const helpers = readFileSync(
      join(routeDirectory, 'components', 'model-list-helpers.ts'),
      'utf8'
    )
    expect(helpers).toMatch(/MODEL_LIST_BADGE_CLASS/)
    expect(helpers).toMatch(/bg-status-success text-status-success-foreground/)
    expect(helpers).toMatch(/bg-status-information text-status-information-foreground/)
    expect(helpers).toMatch(/bg-status-warning text-status-warning-foreground/)
    expect(helpers).toMatch(/bg-status-error text-status-error-foreground/)
    expect(helpers).not.toMatch(/bg-green-100|bg-blue-100|bg-amber-100|bg-red-100|bg-gray-100/)
    // Story 174.2: the registry config carries labels + pulse only — no className
    // field. Colour overlays live exclusively in route-local maps.
    expect(helpers).not.toMatch(/className:/)
  })

  it('detach pin: list badge overlay read from the registry-local map', () => {
    const list = readFileSync(join(routeDirectory, 'components', 'ModelListSection.tsx'), 'utf8')
    expect(list).toMatch(/MODEL_LIST_BADGE_CLASS\[model\.status\]/)
    expect(list).not.toMatch(/badge\.className|STATUS_BADGE_CONFIG\[[^\]]*\]\.className/)
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
