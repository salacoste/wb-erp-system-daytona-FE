import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const DETAIL_OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/shipments/[id]/page.tsx',
  'src/components/custom/shipments/BoxLineForm.tsx',
  'src/components/custom/shipments/BoxLineFormFields.tsx',
  'src/components/custom/shipments/BoxLineTable.tsx',
  'src/components/custom/shipments/BoxLineTableRow.tsx',
  'src/components/custom/shipments/CalculationResults.tsx',
  'src/components/custom/shipments/PalletAccordion.tsx',
  'src/components/custom/shipments/PalletAccordionItem.tsx',
  'src/components/custom/shipments/PreflightWarnings.tsx',
  'src/components/custom/shipments/ShipmentActions.tsx',
  'src/components/custom/shipments/ShipmentDeleteDialog.tsx',
  'src/components/custom/shipments/ShipmentDetailHeader.tsx',
  'src/components/custom/shipments/ShipmentEditDialog.tsx',
  'src/components/custom/shipments/ValidationErrorItem.tsx',
  'src/components/custom/shipments/ValidationErrorPanel.tsx',
  'src/components/custom/shipments/box-line-form-helpers.ts',
  'src/components/custom/shipments/shipment-action-handlers.ts',
  'src/components/custom/shipments/validation-error-config.ts',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof DETAIL_OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('Story 173.9 shipment detail presentation source contracts', () => {
  it('keeps the exact detail-owned production catalog readable', () => {
    for (const file of DETAIL_OWNED_PRODUCTION_FILES) {
      expect(source(file).length, file).toBeGreaterThan(0)
    }
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(LEGACY_PALETTE.test('text-yellow-600')).toBe(true)
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)

    for (const file of DETAIL_OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses the merged semantic page, context, status, and table compositions', () => {
    const page = source('src/app/(dashboard)/shipments/[id]/page.tsx')
    const header = source('src/components/custom/shipments/ShipmentDetailHeader.tsx')
    const boxLines = source('src/components/custom/shipments/BoxLineTable.tsx')
    const calculations = source('src/components/custom/shipments/CalculationResults.tsx')
    const warning = source('src/components/custom/shipments/ValidationErrorItem.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
    expect(header).toMatch(/PageHeader/)
    expect(header).toMatch(/ContextBar/)
    expect(header).toMatch(/ShipmentStatusBadge/)
    expect(boxLines).toMatch(/ResponsiveTable/)
    expect(boxLines).toMatch(/horizontal-scroll/)
    expect(calculations).toMatch(/ResponsiveTable/)
    expect(calculations).toMatch(/horizontal-scroll/)
    expect(warning).toMatch(/status-warning/)
  })

  it('keeps mutation lifecycle feedback semantic and focus-aware', () => {
    const actions = source('src/components/custom/shipments/ShipmentActions.tsx')
    const editDialog = source('src/components/custom/shipments/ShipmentEditDialog.tsx')
    const pallets = source('src/components/custom/shipments/PalletAccordion.tsx')
    const boxLines = source('src/components/custom/shipments/BoxLineTable.tsx')
    const boxLineForm = source('src/components/custom/shipments/BoxLineForm.tsx')
    const boxLineFields = source('src/components/custom/shipments/BoxLineFormFields.tsx')

    expect(actions).toMatch(/role="status"/)
    expect(actions).toMatch(/returnFocusRef/)
    expect(editDialog).toMatch(/onCloseAutoFocus/)
    expect(editDialog).toMatch(/role="alert"/)
    expect(editDialog).toMatch(/role="status"/)
    expect(pallets).toMatch(/role="status"/)
    expect(boxLines).toMatch(/role="status"/)
    expect(boxLineForm).toMatch(/onCloseAutoFocus/)
    expect(boxLineFields).toMatch(/role="alert"/)
    expect(boxLineForm).toMatch(/role="status"/)
  })
})
