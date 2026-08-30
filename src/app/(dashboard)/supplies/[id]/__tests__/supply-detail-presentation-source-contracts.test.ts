import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

const DETAIL_OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/supplies/[id]/page.tsx',
  'src/app/(dashboard)/supplies/[id]/SupplyDetailSkeleton.tsx',
  'src/app/(dashboard)/supplies/[id]/SupplyDetailError.tsx',
  'src/app/(dashboard)/supplies/[id]/loading.tsx',
  'src/components/custom/supplies/AcceptanceActSection.tsx',
  'src/components/custom/supplies/CloseSupplyDialog.tsx',
  'src/components/custom/supplies/GenerateStickersModal.tsx',
  'src/components/custom/supplies/OrderPickerContent.tsx',
  'src/components/custom/supplies/OrderPickerDrawer.tsx',
  'src/components/custom/supplies/OrderPickerFilters.tsx',
  'src/components/custom/supplies/OrderPickerFooter.tsx',
  'src/components/custom/supplies/OrderPickerRow.tsx',
  'src/components/custom/supplies/OrderPickerTable.tsx',
  'src/components/custom/supplies/RemoveOrderDialog.tsx',
  'src/components/custom/supplies/StickerFormatSelector.tsx',
  'src/components/custom/supplies/StickerPreview.tsx',
  'src/components/custom/supplies/SupplyDocumentsList.tsx',
  'src/components/custom/supplies/SupplyHeader.tsx',
  'src/components/custom/supplies/SupplyOrdersTable.tsx',
  'src/components/custom/supplies/SupplyStatusStepper.tsx',
  'src/components/custom/supplies/order-picker-constants.ts',
  'src/components/custom/supplies/useOrderPickerSelection.ts',
] as const

const STORY_173_12_SHARED_FILES = [
  'src/components/custom/supplies/SupplyStatusBadge.tsx',
  'src/components/custom/supplies/index.ts',
  'src/app/(dashboard)/supplies/__tests__/supplies-list-presentation-source-contracts.test.ts',
] as const

const STORY_173_12_SHARED_SHA256: Record<(typeof STORY_173_12_SHARED_FILES)[number], string> = {
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

type DetailFile = (typeof DETAIL_OWNED_PRODUCTION_FILES)[number]

function source(file: DetailFile): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('Story 173.13 supply detail presentation source contracts', () => {
  it('pins the exact 4-route plus 18-component production manifest', () => {
    expect(DETAIL_OWNED_PRODUCTION_FILES).toHaveLength(22)
    expect(new Set(DETAIL_OWNED_PRODUCTION_FILES)).toHaveLength(22)

    for (const file of DETAIL_OWNED_PRODUCTION_FILES) {
      expect(source(file).length, file).toBeGreaterThan(0)
    }
  })

  it('keeps Story 173.12 shared surfaces outside the detail-owned manifest', () => {
    for (const file of STORY_173_12_SHARED_FILES) {
      expect(DETAIL_OWNED_PRODUCTION_FILES).not.toContain(file)
      const contents = readFileSync(resolve(process.cwd(), file), 'utf8')
      expect(contents.length, file).toBeGreaterThan(0)
      expect(createHash('sha256').update(contents).digest('hex'), file).toBe(
        STORY_173_12_SHARED_SHA256[file]
      )
    }
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(LEGACY_PALETTE.test('text-yellow-600 bg-red-50')).toBe(true)
    expect(LEGACY_PALETTE.test('text-status-warning bg-status-error/10')).toBe(false)
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #17313')).toBe(false)

    for (const file of DETAIL_OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('identifies the dynamic route with shared PageHeader and truthful PageState surfaces', () => {
    const page = source('src/app/(dashboard)/supplies/[id]/page.tsx')
    const skeleton = source('src/app/(dashboard)/supplies/[id]/SupplyDetailSkeleton.tsx')
    const error = source('src/app/(dashboard)/supplies/[id]/SupplyDetailError.tsx')

    expect(`${page}\n${skeleton}`).toMatch(/PageHeader/)
    expect(page).toMatch(/PageState/)
    expect(`${page}\n${skeleton}`).toMatch(/(?:backHref=|href:\s*)["']\/supplies["']/)
    expect(page).toMatch(/useSupplyDetail\(supplyId\)/)
    expect(error).toMatch(/PageState/)
    expect(`${page}\n${error}`).toMatch(/Поставка не найдена/)
  })

  it('keeps lifecycle meaning semantic, textual, and independent of color alone', () => {
    const stepper = source('src/components/custom/supplies/SupplyStatusStepper.tsx')
    const orderRows = [
      source('src/components/custom/supplies/SupplyOrdersTable.tsx'),
      source('src/components/custom/supplies/OrderPickerRow.tsx'),
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
    const page = source('src/app/(dashboard)/supplies/[id]/page.tsx')
    const table = source('src/components/custom/supplies/SupplyOrdersTable.tsx')

    expect(page).toMatch(/router\.push\(`\/orders\?search=\$\{order\.orderId\}`\)/)
    expect(page).toMatch(/removeOrdersMutation\.mutate\(orderIds,\s*\{\s*onSuccess\s*\}\)/)
    expect(table).toMatch(/<Table(?:\s|>)/)
    expect(table).toMatch(/overflow-x-auto|horizontal-scroll/)
    expect(table).toMatch(/aria-label=\{`Удалить заказ \$\{order\.orderId\}`\}/)
  })

  it('preserves virtualized picker behavior and selection limits', () => {
    const table = source('src/components/custom/supplies/OrderPickerTable.tsx')
    const constants = source('src/components/custom/supplies/order-picker-constants.ts')
    const selection = source('src/components/custom/supplies/useOrderPickerSelection.ts')

    expect(table).toMatch(/from ['"]react-window['"]/)
    expect(table).toMatch(/<List/)
    expect(table).toMatch(/rowComponent=\{OrderRow\}/)
    expect(table).toMatch(/rowCount=\{orders\.length\}/)
    expect(table).toMatch(/rowHeight=\{ROW_HEIGHT\}/)
    expect(`${constants}\n${selection}`).toMatch(/1000/)
    expect(`${constants}\n${selection}`).toMatch(/900/)
  })

  it('keeps each Sheet or Dialog named, focus-restoring, and announcement-capable', () => {
    const picker = source('src/components/custom/supplies/OrderPickerDrawer.tsx')
    const close = source('src/components/custom/supplies/CloseSupplyDialog.tsx')
    const stickers = source('src/components/custom/supplies/GenerateStickersModal.tsx')
    const remove = source('src/components/custom/supplies/RemoveOrderDialog.tsx')
    const overlays = [picker, close, stickers, remove].join('\n')
    const announcementSurfaces = [
      overlays,
      source('src/components/custom/supplies/OrderPickerContent.tsx'),
      source('src/components/custom/supplies/StickerPreview.tsx'),
      source('src/components/custom/supplies/AcceptanceActSection.tsx'),
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
