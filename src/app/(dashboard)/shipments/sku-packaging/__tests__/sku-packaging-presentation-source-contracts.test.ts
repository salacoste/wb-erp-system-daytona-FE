import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/shipments/sku-packaging/page.tsx',
  'src/app/(dashboard)/shipments/sku-packaging/useSkuPackagingPageState.ts',
  'src/components/custom/sku-packaging/BoxTypeSelect.tsx',
  'src/components/custom/sku-packaging/BulkAddDialog.tsx',
  'src/components/custom/sku-packaging/BulkPreviewTable.tsx',
  'src/components/custom/sku-packaging/SkuPackagingFilterToolbar.tsx',
  'src/components/custom/sku-packaging/SkuPackagingProductCombobox.tsx',
  'src/components/custom/sku-packaging/SkuPackagingDeleteDialog.tsx',
  'src/components/custom/sku-packaging/SkuPackagingEmptyState.tsx',
  'src/components/custom/sku-packaging/SkuPackagingFormDialog.tsx',
  'src/components/custom/sku-packaging/SkuPackagingTable.tsx',
  'src/components/custom/sku-packaging/index.ts',
  'src/components/custom/sku-packaging/sku-packaging-columns.ts',
  'src/components/custom/sku-packaging/sku-packaging-bulk-utils.ts',
  'src/components/custom/sku-packaging/useSkuPackagingDialogFocus.ts',
] as const

const SHARED_PRODUCTION_FILES = new Set(['ProductCombobox.tsx'])

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: string): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function discoverOwnedProductionFiles(): string[] {
  const routeRoot = 'src/app/(dashboard)/shipments/sku-packaging'
  const componentRoot = 'src/components/custom/sku-packaging'
  const routeFiles = readdirSync(resolve(process.cwd(), routeRoot), { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.[jt]sx?$/.test(entry.name))
    .map(entry => `${routeRoot}/${entry.name}`)
  const componentFiles = readdirSync(resolve(process.cwd(), componentRoot), {
    withFileTypes: true,
  })
    .filter(
      entry =>
        entry.isFile() && /\.[jt]sx?$/.test(entry.name) && !SHARED_PRODUCTION_FILES.has(entry.name)
    )
    .map(entry => `${componentRoot}/${entry.name}`)

  return [...routeFiles, ...componentFiles].sort()
}

describe('Story 173.11 SKU-packaging presentation source contracts', () => {
  it('pins the exact route-owned production catalog', () => {
    expect(discoverOwnedProductionFiles()).toEqual([...OWNED_PRODUCTION_FILES].sort())
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses merged semantic page identity, state, and filter compositions', () => {
    const page = source('src/app/(dashboard)/shipments/sku-packaging/page.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
    expect(page).toMatch(/SkuPackagingFilterToolbar/)
  })

  it('uses the responsive table contract with named status and unit evidence', () => {
    const table = source('src/components/custom/sku-packaging/SkuPackagingTable.tsx')

    expect(table).toMatch(/ResponsiveTable/)
    expect(table).toMatch(/stacked-detail/)
    expect(table).toMatch(/StatusBadge/)
    expect(table).toMatch(/шт\./)
  })

  it('uses semantic validation, pending, and failure announcements in owned dialogs', () => {
    for (const file of [
      'src/components/custom/sku-packaging/SkuPackagingFormDialog.tsx',
      'src/components/custom/sku-packaging/SkuPackagingDeleteDialog.tsx',
      'src/components/custom/sku-packaging/BulkAddDialog.tsx',
    ]) {
      const dialog = source(file)
      expect(dialog, file).toMatch(/role="status"/)
      expect(dialog, file).toMatch(/role="alert"/)
    }
  })

  it('keeps the browser proof deterministic instead of accepting any terminal state', () => {
    const spec = source('e2e/sku-packaging-page.spec.ts')

    expect(spec).toMatch(/page\.route/)
    expect(spec).not.toMatch(/hasTable\s*\|\|/)
    expect(spec).not.toMatch(/waitForTimeout|networkidle/)
  })
})
