/**
 * Story 171.1-FE route presentation source contracts (light guard).
 *
 * Route was born palette-clean (0 legacy sites — compliance-check verdict),
 * so this is a PIN, not a migration sweep. Owned set: 4 production files
 * (page.tsx, AnomaliesList.tsx, ResolveAnomalyDialog.tsx, anomalies-helpers.ts).
 *
 * DISPOSITIONS (not fixed, documented in story Gaps):
 * - severity unrendered — preserve-migration N/A (field plumbed, not displayed).
 * - pagination single-page v1 — data.page/limit unused — N/A.
 * - aria-sort — N/A: sort is server-default (comment pin in AnomaliesList).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Recursive production catalog (169.11 F4 canon): nested dirs cannot escape. */
function productionFiles(): string[] {
  const all = readdirSync(routeDirectory, { recursive: true }).map(file =>
    join(routeDirectory, file as string)
  )
  return all
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .filter(file => !file.includes('__tests__'))
    .filter(file => !/\.(?:test|spec)\./.test(file))
    .sort()
}

// Story 169.11 regex canon (letter-lookahead #197-exempt)
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone)-\d{2,3}\b/

const CONTEXTUAL_FUNC_COLOR = /['"\x60]\s*(?:rgba?|hsla?)\(/

describe('Story 171.1 route presentation source contracts', () => {
  it('productionFiles() recursively enumerates exactly the pinned owned file set', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove must
    // FAIL this pin (upgrades the former count + contains assertions).
    const relative = productionFiles()
      .map(f => f.slice(routeDirectory.length + 1).replace(/\\/g, '/'))
      .sort()
    expect(relative).toEqual([
      'components/AnomaliesList.tsx',
      'components/ResolveAnomalyDialog.tsx',
      'components/anomalies-helpers.ts',
      'page.tsx',
    ])
    // Anchor-safe negative (relative paths cannot collide with a worktree name).
    expect(relative.every(f => !f.includes('__tests__') && !/\.(?:test|spec)\./.test(f))).toBe(true)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('owned production sources contain no raw CSS hex literals (contextual guard)', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('owned production sources contain no raw rgba()/hsl() color literals', () => {
    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(CONTEXTUAL_FUNC_COLOR)
    }
  })

  it('AnomaliesList pins: TableCaption, identity-named resolve control, tabular-nums + mono-negative', () => {
    const list = withoutComments(
      readFileSync(join(componentsDirectory, 'AnomaliesList.tsx'), 'utf8')
    )
    expect(list).toMatch(/<TableCaption>Аномалии ИИ-прогнозов<\/TableCaption>/)
    // Repeated-controls-name AX: aria-label carries anomaly identity
    expect(list).toMatch(/aria-label=\{`Разрешить аномалию #\$\{String\(anomaly\.id\)\}`\}/)
    // tabular-nums on numeric/date cells
    expect((list.match(/tabular-nums/g) ?? []).length).toBe(2)
    // id cell: font-mono WITHOUT tabular-nums (negative pin)
    const monoLine = list.split('\n').find(line => line.includes('font-mono'))
    expect(monoLine).toBeDefined()
    expect(monoLine).not.toMatch(/tabular-nums/)
    // unknown anomalyType muted fallback
    expect(list).toMatch(/Неизвестный тип/)
    // filtered-empty distinction + reset path
    expect(list).toMatch(/Нет аномалий с выбранным фильтром\./)
    expect(list).toMatch(/Сбросить фильтр/)
  })

  it('ResolveAnomalyDialog pins: 409 conflict branch + polite pending announcement', () => {
    const dialog = withoutComments(
      readFileSync(join(componentsDirectory, 'ResolveAnomalyDialog.tsx'), 'utf8')
    )
    expect(dialog).toMatch(/err\.status === 409/)
    expect(dialog).toMatch(/Аномалия уже разрешена\./)
    expect(dialog).toMatch(/aria-busy=\{mutation\.isPending\}/)
    expect(dialog).toMatch(/aria-live="polite"/)
    expect(dialog).toMatch(/Отправка данных…/)
  })

  it('round-2 L1: 44px reset button pinned (min-h-11 in source)', () => {
    const src = readFileSync(join(componentsDirectory, 'AnomaliesList.tsx'), 'utf8')
    expect(src).toMatch(/min-h-11/) // 44px primary-action canon
  })
})
