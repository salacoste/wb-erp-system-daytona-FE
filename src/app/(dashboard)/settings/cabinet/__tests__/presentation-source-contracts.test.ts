import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// 170.6 canon: anchor at the repo root via import.meta.url — NEVER
// process.cwd(). This spec lives at
// src/app/(dashboard)/settings/cabinet/__tests__/ → six levels up = repo root.
const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
  '..'
)

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
  return readFileSync(resolve(repoRoot, file), 'utf8')
}

/**
 * components/custom/settings is shared: the notifications and tax guards own
 * these files, so the cabinet disk discovery excludes them before comparing
 * against the cabinet-owned literal.
 */
const SIBLING_GUARD_OWNED_FILES = new Set([
  'OrderNotificationSettings.tsx',
  'OrderNotifInputs.tsx',
  'tax-settings-form-model.ts',
  'tax-settings-sections.tsx',
  'TaxSettingsForm.tsx',
  'TaxSettingsFormStates.tsx',
  'TaxSettingsWarningDialog.tsx',
])

/** Flat production-file discovery (172.10): relative, forward slashes, sorted. */
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

describe('Story 173.3 cabinet presentation source contracts', () => {
  it('pins the complete route-owned production catalog on disk (per-root, 172.10)', () => {
    // Exact relative-path equality (172.10 canon): a rename or add/remove
    // must FAIL this pin. Replaces the former LITERAL-vs-LITERAL tautology
    // (expect(OWNED).toEqual([same OWNED])) with real disk discovery.
    const componentPrefix = 'src/components/custom/settings/'
    const routePrefix = 'src/app/(dashboard)/settings/cabinet/'
    const expectedComponents = OWNED_PRODUCTION_FILES.filter(f => f.startsWith(componentPrefix))
      .map(f => f.slice(componentPrefix.length))
      .sort()
    const expectedRoute = OWNED_PRODUCTION_FILES.filter(f => f.startsWith(routePrefix))
      .map(f => f.slice(routePrefix.length))
      .sort()
    const settingsRoot = resolve(repoRoot, 'src/components/custom/settings')
    const routeRoot = resolve(repoRoot, 'src/app/(dashboard)/settings/cabinet')
    expect(
      prodFilesUnder(settingsRoot).filter(name => !SIBLING_GUARD_OWNED_FILES.has(name))
    ).toEqual(expectedComponents)
    // Route root: the whole cabinet route dir is cabinet-owned (no split).
    expect(prodFilesUnder(routeRoot)).toEqual(expectedRoute)
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
