/**
 * Story 173.12 micro-guards — Supplies LIST (owner-story; owned surface:
 * the /supplies route tree EXCLUDING the [id] detail route, plus the
 * LIST/SHARED files of src/components/custom/supplies/**. Detail-exclusive
 * components — the OrderPicker family, Sticker family, stepper, dialogs,
 * SupplyHeader/SupplyOrdersTable/SupplyDocumentsList — belong to Story
 * 173.13 and are EXCLUDED from this catalog and these scans (cross-
 * restraint; they are still legacy and migrate in their own story).
 * Catalog pinned per-file; no-palette/no-hex over the owned set; contract
 * pins (5-status badge map incl. status-pending, sync indicator valence,
 * create-modal alert). 169.11 regex canon; anchor-safe enumeration.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const suppliesDirectory = resolve(routeDirectory, '../../../components/custom/supplies')

function prodFiles(root: string): string[] {
  return readdirSync(root)
    .map(f => f as string)
    .filter(f => !/\.(?:test|spec)\./.test(f))
    .filter(f => /\.(?:ts|tsx)$/.test(f))
    .map(f => join(root, f))
    .sort()
}

// Detail-exclusive (Story 173.13) — excluded from the 173.12 catalog/scans.
const DETAIL_EXCLUDED = [
  'AcceptanceActSection.tsx',
  'CloseSupplyDialog.tsx',
  'GenerateStickersModal.tsx',
  'OrderPickerContent.tsx',
  'OrderPickerDrawer.tsx',
  'OrderPickerFilters.tsx',
  'OrderPickerFooter.tsx',
  'OrderPickerRow.tsx',
  'OrderPickerTable.tsx',
  'RemoveOrderDialog.tsx',
  'StickerFormatSelector.tsx',
  'StickerPreview.tsx',
  'SupplyDocumentsList.tsx',
  'SupplyHeader.tsx',
  'SupplyOrdersTable.tsx',
  'SupplyStatusStepper.tsx',
  'order-picker-constants.ts',
  'useOrderPickerSelection.ts',
]

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function ownedFiles(): string[] {
  const route = prodFiles(routeDirectory).filter(f => !f.startsWith(join(routeDirectory, '[id]')))
  const components = prodFiles(suppliesDirectory).filter(
    f => !DETAIL_EXCLUDED.some(d => f === join(suppliesDirectory, d))
  )
  return [...route, ...components]
}

function shared(name: string): string {
  return join(suppliesDirectory, name)
}

describe('Story 173.12 supplies-list presentation source contracts', () => {
  it('catalog pinned (4 route + 12 list/shared files; 18 detail-exclusive excluded)', () => {
    const files = ownedFiles()
    expect(files).toHaveLength(16)
    const relative = files
      .map(f =>
        f.replace(`${routeDirectory}/`, '').replace(`${suppliesDirectory}/`, '').replace(/\\/g, '/')
      )
      .sort()
    expect(relative).toEqual([
      'CreateSupplyButton.tsx',
      'CreateSupplyModal.tsx',
      'SuppliesEmptyState.tsx',
      'SuppliesFilters.tsx',
      'SuppliesLoadingSkeleton.tsx',
      'SuppliesPageHeader.tsx',
      'SuppliesPagination.tsx',
      'SuppliesTable.tsx',
      'SuppliesTableRow.tsx',
      'SupplyStatusBadge.tsx',
      'SyncStatusIndicator.tsx',
      'index.ts',
      'loading.tsx',
      'page.tsx',
      'supplies-page-utils.ts',
      'useSuppliesPageState.ts',
    ])
  })

  it('no legacy palette classes in any owned file (regex self-tested)', () => {
    // Pass-2 hardening: positive control proves the regex bites.
    expect(LEGACY_PALETTE.test('text-blue-700 bg-orange-50')).toBe(true)
    expect(LEGACY_PALETTE.test('bg-status-error/10 text-status-pending')).toBe(false)
    for (const f of ownedFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of ownedFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('status badge pin: 5-status map on status tokens (purple = status-pending)', () => {
    const src = readFileSync(shared('SupplyStatusBadge.tsx'), 'utf8')
    expect(src).toMatch(/'text-status-information'/)
    expect(src).toMatch(/'bg-status-information\/10'/)
    expect(src).toMatch(/'text-status-warning-foreground'/) // WCAG solid pair
    // Pass-2 hardening: the SOLID bg is the load-bearing half of the WCAG fix.
    expect(src).toMatch(/'bg-status-warning'/)
    expect(src).toMatch(/'text-status-pending'/)
    expect(src).toMatch(/'bg-status-pending\/10'/)
    expect(src).toMatch(/'border-status-pending\/40'/)
    expect(src).toMatch(/'text-status-success'/)
    expect(src).toMatch(/'text-status-error'/)
    // All five borders on /40 (banner-shape canon).
    expect(src.match(/border-status-[a-z]+\/40/g)).toHaveLength(5)
  })

  it('sync indicator pin: ok/error icons on status tokens', () => {
    const src = readFileSync(shared('SyncStatusIndicator.tsx'), 'utf8')
    expect(src).toMatch(/text-status-success/)
    expect(src).toMatch(/text-status-error/)
  })

  it('create modal pin: error alert on status-error', () => {
    const src = readFileSync(shared('CreateSupplyModal.tsx'), 'utf8')
    expect(src).toMatch(/text-status-error" role="alert"/)
  })
})
