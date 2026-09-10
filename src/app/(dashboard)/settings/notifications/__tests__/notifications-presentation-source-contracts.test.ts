/**
 * Story 173.5 notification presentation source contracts.
 *
 * 172.10 exact-array catalog pins (Flavor C — per-root discovery vs literal):
 * the owned surface spans THREE roots — the route dir, the order-notification
 * slice of components/custom/settings, and components/notifications (wholly
 * owned). Literals = live disk enumeration, relative, forward slashes,
 * sorted. Sibling exclusions are EXPLICIT: components/custom/settings is
 * shared with the cabinet guard (CabinetInfoCard/JamStatusBadge/
 * SellerRatingCard/TargetMarginSettingsCard) and the tax guard (the
 * TaxSettings family + tax-settings-* helpers).
 * All reads anchor to import.meta.url (170.6 canon) — no process working directory dependence.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const routeDirectory = resolve(testDirectory, '..')
const srcRoot = resolve(routeDirectory, '..', '..', '..', '..')
const settingsCustomRoot = join(srcRoot, 'components', 'custom', 'settings')
const notificationsRoot = join(srcRoot, 'components', 'notifications')

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
 * components/custom/settings is SHARED: these 9 files belong to sibling
 * guards (4 cabinet + 5 tax) and are excluded from this Story's discovery
 * AND scans.
 */
const SIBLING_GUARD_OWNED_FILES = new Set([
  'CabinetInfoCard.tsx',
  'JamStatusBadge.tsx',
  'SellerRatingCard.tsx',
  'TargetMarginSettingsCard.tsx',
  'TaxSettingsForm.tsx',
  'TaxSettingsFormStates.tsx',
  'TaxSettingsWarningDialog.tsx',
  'tax-settings-form-model.ts',
  'tax-settings-sections.tsx',
])

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function routeSource(name: string): string {
  return readFileSync(join(routeDirectory, name), 'utf8')
}

function notificationsSource(name: string): string {
  return readFileSync(join(notificationsRoot, name), 'utf8')
}

describe('Story 173.5 notification presentation source contracts', () => {
  it('pins the route-local catalog (3 files)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin (upgrades the former toHaveLength(23) + Set-unique
    // checks over one flat 3-root list).
    expect(prodFilesUnder(routeDirectory)).toEqual([
      'NotificationsDisabledPanel.tsx',
      'NotificationsHeroBanner.tsx',
      'page.tsx',
    ])
  })

  it('pins the order-notification slice of components/custom/settings (2 files)', () => {
    const discovered = prodFilesUnder(settingsCustomRoot).filter(
      name => !SIBLING_GUARD_OWNED_FILES.has(name)
    )
    expect(discovered).toEqual(['OrderNotifInputs.tsx', 'OrderNotificationSettings.tsx'])
  })

  it('pins the shared notification components catalog (18 files; root wholly owned)', () => {
    expect(prodFilesUnder(notificationsRoot)).toEqual([
      'BindingCodeStep.tsx',
      'EventTypeCard.tsx',
      'LanguageRadio.tsx',
      'NotificationPreferencesPanel.tsx',
      'PreferencesActionBar.tsx',
      'QuietHoursPanel.tsx',
      'QuietHoursScheduleDisplay.tsx',
      'QuietHoursTimePickers.tsx',
      'TelegramBindingCard.tsx',
      'TelegramBindingModal.tsx',
      'TimezoneSelect.tsx',
      'UnbindConfirmationDialog.tsx',
      'index.ts',
      'preferencesSaveHandler.ts',
      'usePreferencesPanelState.ts',
      'useQuietHoursPanel.ts',
      'useTelegramBindingModal.helpers.ts',
      'useTelegramBindingModal.ts',
    ])
  })

  it('contains no legacy palette classes or contextual hex literals (all 3 roots)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#0088CC'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.5')).toBe(false)

    const owned = [
      ...prodFilesUnder(routeDirectory).map(n => join(routeDirectory, n)),
      ...prodFilesUnder(settingsCustomRoot)
        .filter(name => !SIBLING_GUARD_OWNED_FILES.has(name))
        .map(n => join(settingsCustomRoot, n)),
      ...prodFilesUnder(notificationsRoot).map(n => join(notificationsRoot, n)),
    ]
    for (const file of owned) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(LEGACY_PALETTE)
      expect(readFileSync(file, 'utf8'), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses shared route compositions and registered semantic channel tokens', () => {
    const page = routeSource('page.tsx')
    const hero = routeSource('NotificationsHeroBanner.tsx')
    const binding = notificationsSource('BindingCodeStep.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(hero).toMatch(/(?:text|border|bg)-telegram/)
    expect(binding).toMatch(/(?:text|border|bg)-telegram/)
  })
})
