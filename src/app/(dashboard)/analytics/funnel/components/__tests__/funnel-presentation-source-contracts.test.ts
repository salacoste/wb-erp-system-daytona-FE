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

/** Canon catalog discovery (172.10): route-tree recursive, tests excluded. */
function catalogFiles(): string[] {
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

describe('Story 169.8 route presentation source contracts', () => {
  it('catalog pinned (28 route files, per-file identity)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin. `funnel-anomaly.test.ts` lives flat in components/
    // and stays in the palette/hex scan set (productionFiles) but is NOT a
    // catalog member — excluded here by the test-file filter.
    const expected = [
      'components/FunnelAnomalyIndicator.tsx',
      'components/FunnelDeltaIndicator.tsx',
      'components/FunnelOverlayChart.tsx',
      'components/FunnelOverlayEvidence.tsx',
      'components/FunnelOverlayPlot.tsx',
      'components/FunnelOverlayTooltip.tsx',
      'components/FunnelPageContent.tsx',
      'components/FunnelProductFilter.tsx',
      'components/FunnelSummaryCards.tsx',
      'components/FunnelSummarySlowLoading.tsx',
      'components/FunnelSyncStatus.tsx',
      'components/FunnelTable.tsx',
      'components/SyncStatusBanner.tsx',
      'components/funnel-anomaly.ts',
      'components/funnel-comparison-utils.ts',
      'components/funnel-overlay-config.ts',
      'components/funnel-overlay-retained-state.ts',
      'components/funnel-overlay-terminal-frame.tsx',
      'components/funnel-page-helpers.ts',
      'components/funnel-summary-card-config.ts',
      'components/funnel-summary-formatters.ts',
      'components/funnel-table-cells.tsx',
      'components/funnel-table-columns.tsx',
      'components/funnel-table-delta.tsx',
      'components/funnel-table-feedback.tsx',
      'components/funnel-table-rows.tsx',
      'components/useFunnelExportData.ts',
      'page.tsx',
    ]
    const relative = catalogFiles()
      .map(f => f.slice(routeDirectory.length + 1).replace(/\\/g, '/'))
      .sort()
    expect(relative).toEqual(expected)
  })

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
