import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/shipments/page.tsx',
  'src/app/(dashboard)/shipments/useShipmentsPageState.ts',
  'src/components/custom/shipments/CreateShipmentDialog.tsx',
  'src/components/custom/shipments/ShipmentFormFields.tsx',
  'src/components/custom/shipments/ShipmentQueueCards.tsx',
  'src/components/custom/shipments/ShipmentStatusBadge.tsx',
  'src/components/custom/shipments/ShipmentsEmptyState.tsx',
  'src/components/custom/shipments/ShipmentsFilterToolbar.tsx',
  'src/components/custom/shipments/ShipmentsPagination.tsx',
  'src/components/custom/shipments/ShipmentsTable.tsx',
  'src/components/custom/shipments/shipments-columns.ts',
] as const

const EXCLUDED_COMPONENT_FILES = new Set([
  'BoxLineForm.tsx',
  'BoxLineFormFields.tsx',
  'BoxLineTable.tsx',
  'BoxLineTableRow.tsx',
  'CalculationResults.tsx',
  'PalletAccordion.tsx',
  'PalletAccordionItem.tsx',
  'PreflightWarnings.tsx',
  'ShipmentActions.tsx',
  'ShipmentDeleteDialog.tsx',
  'ShipmentDetailHeader.tsx',
  'ShipmentEditDialog.tsx',
  'ValidationErrorItem.tsx',
  'ValidationErrorPanel.tsx',
  'box-line-form-helpers.ts',
  'index.ts',
  'shipment-action-handlers.ts',
  'validation-error-config.ts',
])
const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function productionNames(entries: { isFile(): boolean; name: string }[]): string[] {
  return entries
    .filter(entry => entry.isFile() && /\.tsx?$/.test(entry.name))
    .filter(entry => !/\.(?:test|spec)\.[jt]sx?$/.test(entry.name))
    .map(entry => entry.name)
}

function listOwnedComponentNames(names: string[]): string[] {
  return names.filter(name => !EXCLUDED_COMPONENT_FILES.has(name))
}

function discoverOwnedProductionFiles(): string[] {
  const routeRoot = 'src/app/(dashboard)/shipments'
  const componentRoot = 'src/components/custom/shipments'
  const routeFiles = productionNames(
    readdirSync(resolve(process.cwd(), routeRoot), { withFileTypes: true })
  ).map(name => `${routeRoot}/${name}`)
  const componentFiles = listOwnedComponentNames(
    productionNames(
      readdirSync(resolve(process.cwd(), componentRoot), {
        withFileTypes: true,
      })
    )
  ).map(name => `${componentRoot}/${name}`)

  return [...routeFiles, ...componentFiles].sort()
}

describe('Story 173.8 shipments presentation source contracts', () => {
  it('pins the exact shipments-list production catalog', () => {
    expect(listOwnedComponentNames(['LegacyShipmentQueue.tsx'])).toEqual([
      'LegacyShipmentQueue.tsx',
    ])
    expect(discoverOwnedProductionFiles()).toEqual([...OWNED_PRODUCTION_FILES].sort())
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.8')).toBe(false)

    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses the merged semantic page, state, filter, table, and status compositions', () => {
    const page = source('src/app/(dashboard)/shipments/page.tsx')
    const table = source('src/components/custom/shipments/ShipmentsTable.tsx')
    const filters = source('src/components/custom/shipments/ShipmentsFilterToolbar.tsx')
    const status = source('src/components/custom/shipments/ShipmentStatusBadge.tsx')
    const dialog = source('src/components/custom/shipments/CreateShipmentDialog.tsx')
    const fields = source('src/components/custom/shipments/ShipmentFormFields.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
    expect(table).toMatch(/ResponsiveTable/)
    expect(table).toMatch(/TableState/)
    expect(table).toMatch(/stacked-detail/)
    expect(filters).toMatch(/FilterToolbar/)
    expect(status).toMatch(/StatusBadge/)
    expect(status).toMatch(/sourceValue/)
    expect(fields).toMatch(/role="alert"/)
    expect(dialog).toMatch(/role="status"/)
  })
})
