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
  const componentFiles = readdirSync(componentsDirectory)
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .map(file => join(componentsDirectory, file))
  return [join(routeDirectory, 'page.tsx'), ...componentFiles]
}

describe('Story 169.9 route presentation source contracts', () => {
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
