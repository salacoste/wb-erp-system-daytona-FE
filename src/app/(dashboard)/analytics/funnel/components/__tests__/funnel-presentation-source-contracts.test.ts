import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')
const orphanChartPath = join(componentsDirectory, 'FunnelChart.tsx')
const orphanAlertsPath = join(componentsDirectory, 'FunnelOverlayAlerts.tsx')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function productionFiles(): string[] {
  const componentFiles = readdirSync(componentsDirectory)
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .map(file => join(componentsDirectory, file))
  return [join(routeDirectory, 'page.tsx'), ...componentFiles]
}

describe('Story 169.8 route presentation source contracts', () => {
  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|blue|green|red|amber|orange|indigo|teal|emerald|purple)-\d{2,3}\b/

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

  it('route-owned migrated controls use the shared Button composition', () => {
    const controlFiles = [
      'FunnelPageContent.tsx',
      'FunnelProductFilter.tsx',
      'FunnelOverlayTooltip.tsx',
      'funnel-table-cells.tsx',
    ]

    for (const file of controlFiles) {
      expect(readFileSync(join(componentsDirectory, file), 'utf8'), file).not.toMatch(/<button\b/)
    }
  })

  it('proves the legacy FunnelChart has no production consumer', () => {
    for (const file of productionFiles().filter(file => file !== orphanChartPath)) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/from ['"]\.\/FunnelChart['"]|<FunnelChart\b/)
    }
  })

  it('removes the proven orphan FunnelChart implementation', () => {
    expect(existsSync(orphanChartPath)).toBe(false)
  })

  it('keeps neutral funnel stages on categorical chart roles', () => {
    const source = readFileSync(join(componentsDirectory, 'funnel-summary-card-config.ts'), 'utf8')
    expect(source).not.toMatch(/text-status-(?:information|warning|success)/)
  })

  it('removes the superseded route-local overlay alert implementation', () => {
    expect(existsSync(orphanAlertsPath)).toBe(false)
  })
})
