/**
 * Story 173.6 tariff presentation source contracts.
 *
 * 172.10 exact-array catalog pins (per-root discovery vs literal): the owned
 * surface spans TWO roots — the route dir (page.tsx) and the wholly-owned
 * src/components/custom/tariffs-admin/ directory (no sibling guard scans
 * it). Literals = live disk enumeration, relative, forward slashes, sorted.
 * FINDING (wave-3 conversion, 2026-09-09): the former toHaveLength(29) pin
 * had gone stale — disk enumerated 31 tariffs-admin files (+ScheduleVersion*
 * form/fields/modal, shipped via the index.ts barrel after the pin was
 * written and clean of palette/hex). Pure catalog pin → literal adjusted to
 * disk reality (32 total), strengthening the palette/hex scan coverage.
 * All reads anchor to import.meta.url (170.6 canon) — no process working directory dependence.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const routeDirectory = resolve(testDirectory, '..')
const srcRoot = resolve(routeDirectory, '..', '..', '..', '..')
const tariffsAdminRoot = join(srcRoot, 'components', 'custom', 'tariffs-admin')

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

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

describe('Story 173.6 tariff presentation source contracts', () => {
  it('pins the exact route-reachable tariff production catalog (1 route + 31 admin)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL these pins (upgrades the former toHaveLength(29) + Set-unique
    // checks over one flat hand-maintained list).
    expect(prodFilesUnder(routeDirectory)).toEqual(['page.tsx'])
    expect(prodFilesUnder(tariffsAdminRoot)).toEqual([
      'AcceptanceRatesSection.tsx',
      'AuditActionBadge.tsx',
      'AuditFieldFilter.tsx',
      'AuditLogTable.tsx',
      'AuditLogTableParts.tsx',
      'AuditValueDisplay.tsx',
      'CommissionRatesSection.tsx',
      'DeleteVersionDialog.tsx',
      'FbsSettingsSection.tsx',
      'LogisticsRatesSection.tsx',
      'LogisticsTierRow.tsx',
      'LogisticsTiersEditor.tsx',
      'RateLimitIndicator.tsx',
      'ReturnsRatesSection.tsx',
      'SaveConfirmDialog.tsx',
      'ScheduleVersionForm.tsx',
      'ScheduleVersionFormFields.tsx',
      'ScheduleVersionModal.tsx',
      'StorageSettingsSection.tsx',
      'TariffFieldInput.tsx',
      'TariffFormActions.tsx',
      'TariffFormSkeleton.tsx',
      'TariffFormStatus.tsx',
      'TariffSectionWrapper.tsx',
      'TariffSettingsForm.tsx',
      'VersionHistoryTable.tsx',
      'VersionHistoryTableStates.tsx',
      'VersionStatusBadge.tsx',
      'index.ts',
      'tariffSettingsSchema.ts',
      'useTariffSettingsForm.ts',
    ])
  })

  it('contains no legacy palette classes or contextual hex literals (both roots)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.6')).toBe(false)

    const owned = [
      ...prodFilesUnder(routeDirectory).map(n => join(routeDirectory, n)),
      ...prodFilesUnder(tariffsAdminRoot).map(n => join(tariffsAdminRoot, n)),
    ]
    for (const file of owned) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(LEGACY_PALETTE)
      expect(readFileSync(file, 'utf8'), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses shared page context and exposes semantic form lifecycle feedback', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    const form = readFileSync(join(tariffsAdminRoot, 'TariffSettingsForm.tsx'), 'utf8')
    const formStatus = readFileSync(join(tariffsAdminRoot, 'TariffFormStatus.tsx'), 'utf8')
    const fields = readFileSync(join(tariffsAdminRoot, 'TariffFieldInput.tsx'), 'utf8')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(form).toMatch(/TariffFormStatus/)
    expect(formStatus).toMatch(/Результат сохранения тарифов/)
    expect(formStatus).toMatch(/Ошибки формы тарифов/)
    expect(fields).toMatch(/aria-describedby/)
  })
})
