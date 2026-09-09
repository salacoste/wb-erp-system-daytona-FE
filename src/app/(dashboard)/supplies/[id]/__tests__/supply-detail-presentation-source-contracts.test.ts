/**
 * Story 173.13 supply detail presentation source contracts.
 *
 * 172.10 exact-array catalog pins (per-root discovery vs literal): the owned
 * surface spans TWO roots — the [id] route dir (4 files) and the
 * DETAIL-EXCLUSIVE slice of src/components/custom/supplies (18 files). The
 * remaining 12 shared/list files of that directory belong to the sibling
 * Story 173.12 guard (cross-restraint; see its DETAIL_EXCLUDED mirror) and
 * are excluded EXPLICITLY — dropping the exclusion would double-scan and
 * double-fail those files. Literals = live disk enumeration, relative,
 * forward slashes, sorted. The Story 173.12 SHA-256 pins below are a
 * byte-identity contract with the 173.12 guard and are untouched by this
 * conversion. All reads anchor to import.meta.url (170.6 canon) — no
 * process.cwd() dependence.
 */
import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const routeDirectory = resolve(testDirectory, '..')
const srcRoot = resolve(routeDirectory, '..', '..', '..', '..')
const suppliesCustomRoot = join(srcRoot, 'components', 'custom', 'supplies')

/** Flat production-file discovery: relative, forward slashes, sorted. */
function prodFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.tsx?$/.test(entry.name))
    .filter(entry => !/\.(?:test|spec)\.[jt]sx?$/.test(entry.name))
    .map(entry => entry.name)
    .map(name =>
      join(dir, name)
        .slice(dir.length + 1)
        .replace(/\\/g, '/')
    )
    .sort()
}

/**
 * LIST/SHARED files owned by the Story 173.12 supplies-list guard — excluded
 * from this Story's detail catalog AND scans (cross-restraint; includes the
 * 2 hash-pinned production files below).
 */
const STORY_173_12_SHARED_FILES = [
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
]

const STORY_173_12_HASH_PINNED = [
  'src/components/custom/supplies/SupplyStatusBadge.tsx',
  'src/components/custom/supplies/index.ts',
  'src/app/(dashboard)/supplies/__tests__/supplies-list-presentation-source-contracts.test.ts',
] as const

const STORY_173_12_SHARED_SHA256: Record<(typeof STORY_173_12_HASH_PINNED)[number], string> = {
  'src/components/custom/supplies/SupplyStatusBadge.tsx':
    'dad90d3de45a9f903fa99378391e78ac55cb703ccf14360a2436ec93939b5705',
  'src/components/custom/supplies/index.ts':
    '41ca3c6affc652b3b5446fbf94f17f45976f1619397efa7690492c2da4fc9d14',
  'src/app/(dashboard)/supplies/__tests__/supplies-list-presentation-source-contracts.test.ts':
    '6feddfbaf67c9ac906977ef9f4b091facbebbc4a121bd4a5202a12ca1064a73a',
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

/** Absolute path of a src-rooted repo path (import.meta.url anchored). */
function srcPath(srcRootedPath: string): string {
  return join(srcRoot, srcRootedPath.replace(/^src\//, ''))
}

function routeSource(name: string): string {
  return readFileSync(join(routeDirectory, name), 'utf8')
}

function detailSource(name: string): string {
  return readFileSync(join(suppliesCustomRoot, name), 'utf8')
}

function detailOwnedFiles(): string[] {
  return prodFilesUnder(suppliesCustomRoot).filter(
    name => !STORY_173_12_SHARED_FILES.includes(name)
  )
}

describe('Story 173.13 supply detail presentation source contracts', () => {
  it('pins the exact 4-route plus 18-component production manifest', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL these pins (upgrades the former toHaveLength(22) + Set-dedup
    // checks over one flat hand-maintained list).
    expect(prodFilesUnder(routeDirectory)).toEqual([
      'SupplyDetailError.tsx',
      'SupplyDetailSkeleton.tsx',
      'loading.tsx',
      'page.tsx',
    ])
    expect(detailOwnedFiles()).toEqual([
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
    ])

    // Readability guard (restored post-172.10 conversion): every owned file
    // must stay non-empty — the 173.12 hash pins cover only 3 shared files.
    for (const file of [
      ...prodFilesUnder(routeDirectory).map(n => join(routeDirectory, n)),
      ...detailOwnedFiles().map(n => join(suppliesCustomRoot, n)),
    ]) {
      expect(readFileSync(file, 'utf8').length, file).toBeGreaterThan(0)
    }
  })

  it('keeps Story 173.12 shared surfaces outside the detail-owned manifest', () => {
    // Byte-identity contract with the 173.12 guard — hashes and paths are
    // untouched by the 172.10 conversion.
    for (const file of STORY_173_12_HASH_PINNED) {
      expect(detailOwnedFiles()).not.toContain(file.split('/').pop())
      const contents = readFileSync(srcPath(file), 'utf8')
      expect(contents.length, file).toBeGreaterThan(0)
      expect(createHash('sha256').update(contents).digest('hex'), file).toBe(
        STORY_173_12_SHARED_SHA256[file]
      )
    }
  })

  it('contains no legacy palette classes or contextual hex literals (both roots)', () => {
    expect(LEGACY_PALETTE.test('text-yellow-600 bg-red-50')).toBe(true)
    expect(LEGACY_PALETTE.test('text-status-warning bg-status-error/10')).toBe(false)
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #17313')).toBe(false)

    const owned = [
      ...prodFilesUnder(routeDirectory).map(n => join(routeDirectory, n)),
      ...detailOwnedFiles().map(n => join(suppliesCustomRoot, n)),
    ]
    for (const file of owned) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(LEGACY_PALETTE)
      expect(readFileSync(file, 'utf8'), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('identifies the dynamic route with shared PageHeader and truthful PageState surfaces', () => {
    const page = routeSource('page.tsx')
    const skeleton = routeSource('SupplyDetailSkeleton.tsx')
    const error = routeSource('SupplyDetailError.tsx')

    expect(`${page}\n${skeleton}`).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
    expect(`${page}\n${skeleton}`).toMatch(/(?:backHref=|href:\s*)["']\/supplies["']/)
    expect(page).toMatch(/useSupplyDetail\(supplyId\)/)
    expect(error).toMatch(/PageState/)
    expect(`${page}\n${error}`).toMatch(/Поставка не найдена/)
  })

  it('keeps lifecycle meaning semantic, textual, and independent of color alone', () => {
    const stepper = detailSource('SupplyStatusStepper.tsx')
    const orderRows = [
      detailSource('SupplyOrdersTable.tsx'),
      detailSource('OrderPickerRow.tsx'),
    ].join('\n')

    expect(stepper).toMatch(/aria-label=["']Статус поставки["']/)
    expect(stepper).toMatch(/aria-current=\{isCurrent \? ['"]step['"] : undefined\}/)
    expect(stepper).toMatch(/status-success/)
    expect(stepper).toMatch(/status-error/)
    expect(stepper).toMatch(/Открыта/)
    expect(stepper).toMatch(/Доставлена/)
    expect(stepper).toMatch(/Отменена/)
    expect(orderRows).toMatch(/status-information/)
    expect(orderRows).toMatch(/status-success/)
    expect(orderRows).toMatch(/status-error/)
  })

  it('preserves the orders table navigation, removal, and responsive semantics', () => {
    const page = routeSource('page.tsx')
    const table = detailSource('SupplyOrdersTable.tsx')

    expect(page).toMatch(/router\.push\(`\/orders\?search=\$\{order\.orderId\}`\)/)
    expect(page).toMatch(/removeOrdersMutation\.mutate\(orderIds,\s*\{\s*onSuccess\s*\}\)/)
    expect(table).toMatch(/<Table(?:\s|>)/)
    expect(table).toMatch(/overflow-x-auto|horizontal-scroll/)
    expect(table).toMatch(/aria-label=\{`Удалить заказ \$\{order\.orderId\}`\}/)
  })

  it('preserves virtualized picker behavior and selection limits', () => {
    const table = detailSource('OrderPickerTable.tsx')
    const constants = detailSource('order-picker-constants.ts')
    const selection = detailSource('useOrderPickerSelection.ts')

    expect(table).toMatch(/from ['"]react-window['"]/)
    expect(table).toMatch(/<List/)
    expect(table).toMatch(/rowComponent=\{OrderRow\}/)
    expect(table).toMatch(/rowCount=\{orders\.length\}/)
    expect(table).toMatch(/rowHeight=\{ROW_HEIGHT\}/)
    expect(`${constants}\n${selection}`).toMatch(/1000/)
    expect(`${constants}\n${selection}`).toMatch(/900/)
  })

  it('keeps each Sheet or Dialog named, focus-restoring, and announcement-capable', () => {
    const picker = detailSource('OrderPickerDrawer.tsx')
    const close = detailSource('CloseSupplyDialog.tsx')
    const stickers = detailSource('GenerateStickersModal.tsx')
    const remove = detailSource('RemoveOrderDialog.tsx')
    const overlays = [picker, close, stickers, remove].join('\n')
    const announcementSurfaces = [
      overlays,
      detailSource('OrderPickerContent.tsx'),
      detailSource('StickerPreview.tsx'),
      detailSource('AcceptanceActSection.tsx'),
    ].join('\n')

    expect(picker).toMatch(/<SheetTitle>/)
    expect(close).toMatch(/<AlertDialogTitle/)
    expect(stickers).toMatch(/<DialogTitle>/)
    expect(remove).toMatch(/<(?:Alert)?DialogTitle/)
    expect(picker).toMatch(/onCloseAutoFocus/)
    expect(close).toMatch(/onCloseAutoFocus/)
    expect(stickers).toMatch(/onCloseAutoFocus/)
    expect(remove).toMatch(/onCloseAutoFocus/)
    expect(overlays).toMatch(/role=["']status["']/)
    expect(announcementSurfaces).toMatch(/role=["']alert["']/)
  })
})
