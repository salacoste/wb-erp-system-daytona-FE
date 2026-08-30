import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/shipments/box-types/page.tsx',
  'src/app/(dashboard)/shipments/box-types/useBoxTypesPageState.ts',
  'src/components/custom/box-types/BoxTypeDeactivateDialog.tsx',
  'src/components/custom/box-types/BoxTypeFormDialog.tsx',
  'src/components/custom/box-types/BoxTypesEmptyState.tsx',
  'src/components/custom/box-types/BoxTypesTable.tsx',
  'src/components/custom/box-types/DimensionField.tsx',
  'src/components/custom/box-types/box-types-columns.ts',
  'src/components/custom/box-types/boxTypeFormValidation.ts',
  'src/components/custom/box-types/index.ts',
  'src/components/custom/box-types/useBoxTypeDialogFocus.ts',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function discoverOwnedProductionFiles(): string[] {
  const routeRoot = 'src/app/(dashboard)/shipments/box-types'
  const componentRoot = 'src/components/custom/box-types'
  const routeFiles = readdirSync(resolve(process.cwd(), routeRoot), { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.[jt]sx?$/.test(entry.name))
    .map(entry => `${routeRoot}/${entry.name}`)
  const componentFiles = readdirSync(resolve(process.cwd(), componentRoot), {
    withFileTypes: true,
  })
    .filter(entry => entry.isFile() && /\.[jt]sx?$/.test(entry.name))
    .map(entry => `${componentRoot}/${entry.name}`)

  return [...routeFiles, ...componentFiles].sort()
}

describe('Story 173.10 box-types presentation source contracts', () => {
  it('pins the exact route-owned production catalog', () => {
    expect(discoverOwnedProductionFiles()).toEqual([...OWNED_PRODUCTION_FILES].sort())
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses the merged semantic page identity and state compositions', () => {
    const page = source('src/app/(dashboard)/shipments/box-types/page.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
  })

  it('uses the merged responsive table contract with a non-color status', () => {
    const table = source('src/components/custom/box-types/BoxTypesTable.tsx')

    expect(table).toMatch(/ResponsiveTable/)
    expect(table).toMatch(/stacked-detail/)
    expect(table).toMatch(/StatusBadge/)
  })

  it('uses semantic pending and error announcements in the form dialog', () => {
    const form = source('src/components/custom/box-types/BoxTypeFormDialog.tsx')

    expect(form).toMatch(/role="status"/)
    expect(form).toMatch(/role="alert"/)
  })

  it('uses semantic pending and error announcements in the deactivate dialog', () => {
    const deactivate = source('src/components/custom/box-types/BoxTypeDeactivateDialog.tsx')

    expect(deactivate).toMatch(/role="status"/)
    expect(deactivate).toMatch(/role="alert"/)
  })
})
