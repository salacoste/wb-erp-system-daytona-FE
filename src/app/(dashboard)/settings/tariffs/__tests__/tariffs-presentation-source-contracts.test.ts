import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROUTE_REACHABLE_PRODUCTION_FILES = [
  'src/app/(dashboard)/settings/tariffs/page.tsx',
  'src/components/custom/tariffs-admin/AcceptanceRatesSection.tsx',
  'src/components/custom/tariffs-admin/AuditActionBadge.tsx',
  'src/components/custom/tariffs-admin/AuditFieldFilter.tsx',
  'src/components/custom/tariffs-admin/AuditLogTable.tsx',
  'src/components/custom/tariffs-admin/AuditLogTableParts.tsx',
  'src/components/custom/tariffs-admin/AuditValueDisplay.tsx',
  'src/components/custom/tariffs-admin/CommissionRatesSection.tsx',
  'src/components/custom/tariffs-admin/DeleteVersionDialog.tsx',
  'src/components/custom/tariffs-admin/FbsSettingsSection.tsx',
  'src/components/custom/tariffs-admin/LogisticsRatesSection.tsx',
  'src/components/custom/tariffs-admin/LogisticsTierRow.tsx',
  'src/components/custom/tariffs-admin/LogisticsTiersEditor.tsx',
  'src/components/custom/tariffs-admin/RateLimitIndicator.tsx',
  'src/components/custom/tariffs-admin/ReturnsRatesSection.tsx',
  'src/components/custom/tariffs-admin/SaveConfirmDialog.tsx',
  'src/components/custom/tariffs-admin/StorageSettingsSection.tsx',
  'src/components/custom/tariffs-admin/TariffFieldInput.tsx',
  'src/components/custom/tariffs-admin/TariffFormActions.tsx',
  'src/components/custom/tariffs-admin/TariffFormSkeleton.tsx',
  'src/components/custom/tariffs-admin/TariffFormStatus.tsx',
  'src/components/custom/tariffs-admin/TariffSectionWrapper.tsx',
  'src/components/custom/tariffs-admin/TariffSettingsForm.tsx',
  'src/components/custom/tariffs-admin/VersionHistoryTable.tsx',
  'src/components/custom/tariffs-admin/VersionHistoryTableStates.tsx',
  'src/components/custom/tariffs-admin/VersionStatusBadge.tsx',
  'src/components/custom/tariffs-admin/tariffSettingsSchema.ts',
  'src/components/custom/tariffs-admin/useTariffSettingsForm.ts',
  'src/components/custom/tariffs-admin/index.ts',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof ROUTE_REACHABLE_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('Story 173.6 tariff presentation source contracts', () => {
  it('pins the exact route-reachable tariff production catalog', () => {
    expect(ROUTE_REACHABLE_PRODUCTION_FILES).toHaveLength(29)
    expect(new Set(ROUTE_REACHABLE_PRODUCTION_FILES).size).toBe(
      ROUTE_REACHABLE_PRODUCTION_FILES.length
    )
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.6')).toBe(false)

    for (const file of ROUTE_REACHABLE_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses shared page context and exposes semantic form lifecycle feedback', () => {
    const page = source('src/app/(dashboard)/settings/tariffs/page.tsx')
    const form = source('src/components/custom/tariffs-admin/TariffSettingsForm.tsx')
    const formStatus = source('src/components/custom/tariffs-admin/TariffFormStatus.tsx')
    const fields = source('src/components/custom/tariffs-admin/TariffFieldInput.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(form).toMatch(/TariffFormStatus/)
    expect(formStatus).toMatch(/Результат сохранения тарифов/)
    expect(formStatus).toMatch(/Ошибки формы тарифов/)
    expect(fields).toMatch(/aria-describedby/)
  })
})
