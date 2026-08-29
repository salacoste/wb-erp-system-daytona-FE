import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function productionFiles(): string[] {
  return readdirSync(routeDirectory, { recursive: true })
    .map(file => file as string)
    .filter(file => !file.startsWith('__tests__/') && !file.includes('/__tests__/'))
    .filter(file => !/\.(?:test|spec)\./.test(file))
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .map(file => join(routeDirectory, file))
    .sort()
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(relativePath: string): string {
  return readFileSync(join(routeDirectory, relativePath), 'utf8')
}

describe('Story 173.2 backfill presentation source contracts', () => {
  it('pins the complete route-owned production catalog', () => {
    const relative = productionFiles().map(file =>
      file.slice(routeDirectory.length + 1).replace(/\\/g, '/')
    )

    expect(relative).toEqual([
      'components/BackfillControlButtons.tsx',
      'components/BackfillErrorLog.tsx',
      'components/BackfillProgressBar.tsx',
      'components/BackfillRetryControls.tsx',
      'components/BackfillStatusTable.tsx',
      'components/StartBackfillDialog.tsx',
      'components/backfill-presentation.tsx',
      'loading.tsx',
      'page.tsx',
      'use-backfill-handlers.ts',
    ])
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('ticket #1732')).toBe(false)

    for (const file of productionFiles()) {
      const contents = readFileSync(file, 'utf8')
      expect(contents, file).not.toMatch(LEGACY_PALETTE)
      expect(contents, file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses merged PageHeader, ContextBar, and ResponsiveTable compositions', () => {
    const page = source('page.tsx')
    const table = source('components/BackfillStatusTable.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(table).toMatch(/ResponsiveTable/)
    expect(table).toMatch(/data-table-narrow-content/)
    expect(table).toMatch(/kind: 'horizontal-scroll'/)
    expect(table).toMatch(/regionLabel: 'Горизонтальная прокрутка таблицы бэкфилла'/)
    expect(table).toMatch(/caption="Состояние загрузки исторических данных по кабинетам"/)
  })

  it('keeps raw-palette helpers out of the migrated render tree', () => {
    expect(source('components/BackfillStatusTable.tsx')).not.toMatch(/getStatusConfig/)
    expect(source('components/BackfillProgressBar.tsx')).not.toMatch(/getProgressColorClass/)
    expect(source('components/BackfillErrorLog.tsx')).not.toMatch(/<button\b/)
  })
})
