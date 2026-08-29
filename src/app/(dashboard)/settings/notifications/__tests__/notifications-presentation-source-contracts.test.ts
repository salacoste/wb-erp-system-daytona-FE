import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/settings/notifications/NotificationsDisabledPanel.tsx',
  'src/app/(dashboard)/settings/notifications/NotificationsHeroBanner.tsx',
  'src/app/(dashboard)/settings/notifications/page.tsx',
  'src/components/custom/settings/OrderNotifInputs.tsx',
  'src/components/custom/settings/OrderNotificationSettings.tsx',
  'src/components/notifications/BindingCodeStep.tsx',
  'src/components/notifications/EventTypeCard.tsx',
  'src/components/notifications/LanguageRadio.tsx',
  'src/components/notifications/NotificationPreferencesPanel.tsx',
  'src/components/notifications/PreferencesActionBar.tsx',
  'src/components/notifications/QuietHoursPanel.tsx',
  'src/components/notifications/QuietHoursScheduleDisplay.tsx',
  'src/components/notifications/QuietHoursTimePickers.tsx',
  'src/components/notifications/TelegramBindingCard.tsx',
  'src/components/notifications/TelegramBindingModal.tsx',
  'src/components/notifications/TimezoneSelect.tsx',
  'src/components/notifications/UnbindConfirmationDialog.tsx',
  'src/components/notifications/index.ts',
  'src/components/notifications/preferencesSaveHandler.ts',
  'src/components/notifications/usePreferencesPanelState.ts',
  'src/components/notifications/useQuietHoursPanel.ts',
  'src/components/notifications/useTelegramBindingModal.helpers.ts',
  'src/components/notifications/useTelegramBindingModal.ts',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('Story 173.5 notification presentation source contracts', () => {
  it('pins the complete route-owned notification production catalog', () => {
    expect(OWNED_PRODUCTION_FILES).toHaveLength(23)
    expect(new Set(OWNED_PRODUCTION_FILES).size).toBe(OWNED_PRODUCTION_FILES.length)
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#0088CC'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.5')).toBe(false)

    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses shared route compositions and registered semantic channel tokens', () => {
    const page = source('src/app/(dashboard)/settings/notifications/page.tsx')
    const hero = source('src/app/(dashboard)/settings/notifications/NotificationsHeroBanner.tsx')
    const binding = source('src/components/notifications/BindingCodeStep.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/ContextBar/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(hero).toMatch(/(?:text|border|bg)-telegram/)
    expect(binding).toMatch(/(?:text|border|bg)-telegram/)
  })
})
