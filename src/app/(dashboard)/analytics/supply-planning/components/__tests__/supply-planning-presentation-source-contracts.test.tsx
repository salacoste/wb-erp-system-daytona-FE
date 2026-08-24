/**
 * Story 169.13 — Supply Planning presentation source contracts.
 * Canon: 169.12 recursive source guards + 169.10 lib-channel runtime negatives
 * + 169.4 tier-collapse guard. Growth-only: baseline behaviors were locked by
 * the pre-migration suite (58 tests / 10 files).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SupplyDetailRightColumn } from '../SupplyDetailRightColumn'
import { SupplyDetailTrendSection } from '../SupplyDetailTrendSection'
import { SUPPLY_RISK_TOKENS, TREND_TEXT_TOKENS } from '../supply-risk-tokens'
import type { ForecastDay } from '../supply-detail-calculations'
import type { SupplyPlanningItem } from '@/types/supply-planning'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Production sources: route dir recursively, excluding __tests__ (169.12 canon). */
function productionFiles(): string[] {
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '__tests__' || entry.name === '__mocks__') continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(full)
    }
  }
  walk(routeDirectory)
  return files
}

const sources = productionFiles()

describe('Story 169.13 supply-planning presentation source contracts', () => {
  it('production surface is pinned (page + components, no silent growth)', () => {
    expect(sources.length).toBe(24)
  })

  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|slate|zinc|neutral|stone|lime|cyan|sky|violet|fuchsia|pink|rose)-\d{2,3}\b/
    for (const file of sources) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw hex / rgb(a) / hsl color literals', () => {
    const rawColor = /(?:['"`]\s*|-\[)#(?:[0-9A-Fa-f]{3,8})(?=['"`\]])|\b(?:rgba?|hsla?)\(/
    for (const file of sources) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(rawColor)
    }
  })

  it('route does not consume lib color channels (169.10 runtime negatives)', () => {
    const forbidden = [
      /\.color\b/,
      /\.bgColor\b/,
      /getStockoutRiskColor/,
      /getStockoutRiskBgColor/,
      /getStockoutRiskBadgeClasses/,
      /\.textClass/,
      /\.bgClass/,
      /\.replace\('text-', 'bg-'\)/,
    ]
    for (const file of sources) {
      const source = withoutComments(readFileSync(file, 'utf8'))
      for (const pattern of forbidden) {
        expect(source, `${file} matches ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('risk tiers do not collapse: 6 distinct tiers incl. unknown (169.4 canon)', () => {
    const tiers = Object.keys(SUPPLY_RISK_TOKENS)
    expect(tiers).toHaveLength(6)
    expect(tiers).toContain('unknown')
    const distinctChips = new Set(
      tiers.map(t => SUPPLY_RISK_TOKENS[t as keyof typeof SUPPLY_RISK_TOKENS].chip)
    )
    const distinctRows = new Set(
      tiers.map(
        t =>
          SUPPLY_RISK_TOKENS[t as keyof typeof SUPPLY_RISK_TOKENS].rowBg +
          '|' +
          SUPPLY_RISK_TOKENS[t as keyof typeof SUPPLY_RISK_TOKENS].rowBorder
      )
    )
    expect(distinctChips.size).toBe(6)
    expect(distinctRows.size).toBe(6)
  })

  it('unknown tier renders muted — never healthy green', () => {
    const unknown = SUPPLY_RISK_TOKENS.unknown
    expect(`${unknown.chip} ${unknown.card} ${unknown.accentText}`).not.toContain('status-success')
    // and it is distinguishable from healthy
    expect(unknown.chip).not.toBe(SUPPLY_RISK_TOKENS.healthy.chip)
  })

  it('REAL-token pins (169.13 fix F4): every tier cardActive carries ring-2 incl. unknown muted ring', () => {
    for (const tokens of Object.values(SUPPLY_RISK_TOKENS)) {
      expect(tokens.cardActive.length).toBeGreaterThan(0)
      expect(tokens.cardActive).toContain('ring-2')
    }
    // unknown stays a muted ring (visible-unknown), never bare/unringed
    expect(SUPPLY_RISK_TOKENS.unknown.cardActive).toContain('ring-')
    expect(SUPPLY_RISK_TOKENS.unknown.cardActive).not.toContain('status-success')
    // 3 distinct trend text tokens — growing/stable/declining never collapse to one class
    const trendValues = Object.values(TREND_TEXT_TOKENS)
    expect(trendValues).toHaveLength(3)
    expect(new Set(trendValues).size).toBe(3)
  })

  it('sortable header exposes aria-sort; non-sortable action th carries NONE (WAI-ARIA, 169.12 canon)', () => {
    const source = readFileSync(join(componentsDirectory, 'SupplyTableHeader.tsx'), 'utf8')
    // SortHead is the ONLY aria-sort carrier: one usage renders all 10 sortable columns.
    // ×10-sortable pin: every COLUMNS entry goes through SortHead; the action th does not.
    const ariaSortCount = (source.match(/aria-sort=\{/g) ?? []).length
    expect(ariaSortCount).toBe(1) // the single SortHead <th aria-sort={...}>
    expect((source.match(/<SortHead/g) ?? []).length).toBe(1) // one component def used via map
    expect((source.match(/field: '/g) ?? []).length).toBe(10) // 10 sortable columns
    // Negative: the non-sortable «Действие» th must NOT carry aria-sort (aria-sort belongs
    // only on sortable columns; non-sortable heads have NO attribute — StorageSkuTableHeader canon).
    expect(source).not.toMatch(/aria-sort="none"/)
    expect(source).not.toMatch(/aria-sort='none'/)
  })

  it('CSV export uses full filtered processedData, NOT the page slice (behavior pin)', () => {
    const source = readFileSync(join(componentsDirectory, 'SupplyPlanningTable.tsx'), 'utf8')
    expect(source).toMatch(/exportSupplyTableCSV\(processedData\)/)
    expect(source).not.toMatch(/exportSupplyTableCSV\(paginatedData\)/)
  })
})

const baseItem = {
  sku_id: 'SKU-1',
  product_name: 'Тест',
  current_stock: 10,
  in_transit: 0,
  avg_daily_sales: 5,
  days_until_stockout: 2,
  stockout_date: '2026-09-01',
  safety_stock_units: 40,
  effective_stock: 10,
  reorder_quantity: 30,
  reorder_value: 30000,
  selling_price: 1250,
  has_cogs: true,
  cogs_per_unit: 800,
  warehouses: [],
  velocity_trend: 'growing',
  stockout_risk: 'critical',
} as unknown as SupplyPlanningItem

const forecastDays: ForecastDay[] = [
  { day: 1, date: '1 сен', stockStart: 10, sales: 5, stockEnd: 5, isStockout: false, lostUnits: 0 },
  { day: 2, date: '2 сен', stockStart: 5, sales: 5, stockEnd: 0, isStockout: true, lostUnits: 5 },
]

describe('Story 169.13 forecast honesty (preface-review F-2)', () => {
  it('null forecast (null velocity) SUPPRESSES the burn-down with a data-missing placeholder', () => {
    render(<SupplyDetailRightColumn item={baseItem} forecast={null} totalLostUnits={0} />)
    expect(
      screen.getByText('Нет данных о скорости продаж — прогноз стокаута недоступен')
    ).toBeTruthy()
    expect(screen.queryByText(/СТОКАУТ/)).toBeNull()
  })

  it('forecast figures are UNITS (шт), not ₽ — the primary loss line is units', () => {
    render(<SupplyDetailRightColumn item={baseItem} forecast={forecastDays} totalLostUnits={5} />)
    expect(screen.getByText(/шт упущенных продаж/)).toBeTruthy()
  })
})

describe('Story 169.13 sr-only sparkline data alternative (169.11/169.12 canon)', () => {
  it('known trend + velocity → sr-only 14-day list in шт/день', () => {
    const TrendIcon = () => <svg data-testid="trend-icon" />
    const { container } = render(
      <SupplyDetailTrendSection trend="growing" TrendIcon={TrendIcon} avgDailySales={5.25} />
    )
    const sr = container.querySelector('.sr-only')
    expect(sr?.textContent).toContain('день 1 — 5.3 шт/день')
    expect(sr?.textContent).toContain('день 14 — 5.3 шт/день')
  })

  it('null velocity → sr-only alternative says «Нет данных»', () => {
    const { container } = render(
      <SupplyDetailTrendSection trend={null} TrendIcon={null} avgDailySales={null} />
    )
    expect(container.querySelector('.sr-only')).toBeNull() // sparkline suppressed entirely
  })
})
