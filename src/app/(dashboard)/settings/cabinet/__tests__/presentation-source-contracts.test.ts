import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/settings/cabinet/page.tsx',
  'src/components/custom/settings/CabinetInfoCard.tsx',
  'src/components/custom/settings/JamStatusBadge.tsx',
  'src/components/custom/settings/SellerRatingCard.tsx',
  'src/components/custom/settings/TargetMarginSettingsCard.tsx',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('Story 173.3 cabinet presentation source contracts', () => {
  it('pins the complete route-owned production catalog', () => {
    expect(OWNED_PRODUCTION_FILES).toEqual([
      'src/app/(dashboard)/settings/cabinet/page.tsx',
      'src/components/custom/settings/CabinetInfoCard.tsx',
      'src/components/custom/settings/JamStatusBadge.tsx',
      'src/components/custom/settings/SellerRatingCard.tsx',
      'src/components/custom/settings/TargetMarginSettingsCard.tsx',
    ])
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.3')).toBe(false)

    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses merged semantic compositions and accessible form feedback', () => {
    const page = source('src/app/(dashboard)/settings/cabinet/page.tsx')
    const targetMargin = source('src/components/custom/settings/TargetMarginSettingsCard.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(targetMargin).toMatch(/FormDescription/)
    expect(targetMargin).toMatch(/role="status"/)
    expect(targetMargin).toMatch(/aria-live="polite"/)
  })
})
