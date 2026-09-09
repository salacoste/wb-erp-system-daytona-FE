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

function productionFiles(): string[] {
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

describe('Story 169.9 route presentation source contracts', () => {
  it('catalog pinned (6 route files, per-file identity)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin.
    const expected = [
      'components/GapAnalysisDialog.tsx',
      'components/GapsPageContent.tsx',
      'components/GapsSummaryCards.tsx',
      'components/GapsTable.tsx',
      'components/useGapsPageState.ts',
      'page.tsx',
    ]
    const relative = productionFiles()
      .map(f => f.slice(routeDirectory.length + 1).replace(/\\/g, '/'))
      .sort()
    expect(relative).toEqual(expected)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow)-\d{2,3}\b/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw CSS hex color literals', () => {
    const rawHex =
      /(?:['"`]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"`\]])/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(rawHex)
    }
  })

  it('icon chips do not hardcode white icon color (chips own the foreground)', () => {
    const source = readFileSync(join(componentsDirectory, 'GapsSummaryCards.tsx'), 'utf8')
    expect(source).not.toMatch(/text-white/)
  })
})
