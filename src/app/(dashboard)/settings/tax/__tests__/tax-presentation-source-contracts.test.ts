import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OWNED_PRODUCTION_FILES = [
  'src/app/(dashboard)/settings/tax/page.tsx',
  'src/components/custom/settings/TaxSettingsForm.tsx',
  'src/components/custom/settings/TaxSettingsFormStates.tsx',
  'src/components/custom/settings/TaxSettingsWarningDialog.tsx',
  'src/components/custom/settings/tax-settings-form-model.ts',
  'src/components/custom/settings/tax-settings-sections.tsx',
] as const

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function source(file: (typeof OWNED_PRODUCTION_FILES)[number]): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function discoverProductionFiles(root: string, ownsFile: (name: string) => boolean): string[] {
  return readdirSync(resolve(process.cwd(), root), {
    withFileTypes: true,
  }).flatMap(entry => {
    const file = `${root}/${entry.name}`
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : discoverProductionFiles(file, ownsFile)
    }
    if (!entry.isFile() || /\.(?:test|spec)\.[jt]sx?$/.test(entry.name)) return []
    return ownsFile(entry.name) ? [file] : []
  })
}

function discoverOwnedProductionFiles(): string[] {
  const routeFiles = discoverProductionFiles('src/app/(dashboard)/settings/tax', name =>
    /\.[jt]sx?$/.test(name)
  )
  const componentFiles = discoverProductionFiles('src/components/custom/settings', name =>
    /^(?:TaxSettings|tax-settings-).+\.tsx?$/.test(name)
  )
  return [...routeFiles, ...componentFiles].sort()
}

describe('Story 173.7 tax presentation source contracts', () => {
  it('pins the exact route-owned tax production catalog', () => {
    expect(discoverOwnedProductionFiles()).toEqual([...OWNED_PRODUCTION_FILES].sort())
  })

  it('contains no legacy palette classes or contextual hex literals', () => {
    expect(CONTEXTUAL_HEX.test("color: '#F59E0B'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('Story 173.7')).toBe(false)

    for (const file of OWNED_PRODUCTION_FILES) {
      expect(source(file), file).not.toMatch(LEGACY_PALETTE)
      expect(source(file), file).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('uses merged route compositions and semantic lifecycle feedback', () => {
    const page = source('src/app/(dashboard)/settings/tax/page.tsx')
    const form = source('src/components/custom/settings/TaxSettingsForm.tsx')
    const states = source('src/components/custom/settings/TaxSettingsFormStates.tsx')
    const sections = source('src/components/custom/settings/tax-settings-sections.tsx')

    expect(page).toMatch(/PageHeader/)
    expect(page).toMatch(/key=\{cabinetId\}/)
    expect(page).not.toMatch(/min-h-screen/)
    expect(form).toMatch(/ContextBar/)
    expect(form).toMatch(/aria-busy/)
    expect(states).toMatch(/Результат сохранения/)
    expect(states).toMatch(/text-status-success/)
    expect(sections).toMatch(/text-status-warning/)
    expect(sections).toMatch(/aria-invalid/)
  })
})
