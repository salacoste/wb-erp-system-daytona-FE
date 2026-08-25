/**
 * Story 170.4 brand-share presentation source contracts.
 *
 * Guard (170.1 three-branch canon): every owned production file in the
 * brand-share surface must be free of raw hex colors AND Tailwind palette
 * classes (comment-stripped). Includes self-tests proving the detector
 * regexes actually fire on canonical violations.
 *
 * Also pins structural chart contracts that the recharts mock cannot express:
 * share-axis domain [0, 100] and rating-axis integer ticks.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const analyticsDirectory = join(testDirectory, '..')
const srcRoot = join(analyticsDirectory, '..', '..', '..')

/** Owned production files (Story 170.4 + 170.4 extractions). */
const OWNED_FILES = [
  join(analyticsDirectory, 'BrandShareView.tsx'),
  join(analyticsDirectory, 'BrandShareChart.tsx'),
  join(analyticsDirectory, 'BrandShareTooltip.tsx'),
  join(analyticsDirectory, 'BrandShareDateRangeFilter.tsx'),
  join(analyticsDirectory, 'brand-share-chart-config.ts'),
  join(analyticsDirectory, 'brand-share-sr-table.tsx'),
  join(analyticsDirectory, 'brand-share-view-helpers.ts'),
  join(analyticsDirectory, 'brand-share-view-types.ts'),
  join(srcRoot, 'app', '(dashboard)', 'analytics', 'brand-share', 'page.tsx'),
]

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/
const PALETTE_RE =
  /(?:text|bg|border|fill|stroke|ring|from|to|via|decoration|outline|divide|accent|caret|shadow)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('brand-share presentation guard (self-tests)', () => {
  it('HEX_RE fires on canonical hex violations', () => {
    expect(HEX_RE.test('#EEEEEE')).toBe(true)
    expect(HEX_RE.test('#7C3AED')).toBe(true)
    expect(HEX_RE.test('stroke="#757575"')).toBe(true)
  })
  it('PALETTE_RE fires on canonical Tailwind palette violations', () => {
    expect(PALETTE_RE.test('text-amber-500')).toBe(true)
    expect(PALETTE_RE.test('border-gray-200')).toBe(true)
    expect(PALETTE_RE.test('bg-white')).toBe(false) // bg-white is token-adjacent, not palette-N
  })
  it('comment-stripping removes commented violations but keeps live ones', () => {
    const source = '// was #FFFFFF\nconst x = "#3B82F6"'
    expect(HEX_RE.test(withoutComments(source))).toBe(true)
    expect(HEX_RE.test(withoutComments('// old #FFFFFF'))).toBe(false)
  })
})

describe('brand-share owned files: no hex, no Tailwind palette classes', () => {
  it.each(OWNED_FILES)('%s is token-clean', file => {
    const source = withoutComments(readFileSync(file, 'utf-8'))
    expect(HEX_RE.test(source), `hex found in ${file}`).toBe(false)
    expect(PALETTE_RE.test(source), `palette class found in ${file}`).toBe(false)
  })
})

describe('structural chart contracts (mock-inexpressible)', () => {
  it('pins the share-axis domain 0–100 on the left axis', () => {
    const chart = readFileSync(join(analyticsDirectory, 'BrandShareChart.tsx'), 'utf-8')
    expect(chart).toContain('yAxisId="share"')
    expect(chart).toContain('domain={[0, 100]}')
  })
  it('pins the rating axis: right-oriented, reversed, integer ticks', () => {
    const chart = readFileSync(join(analyticsDirectory, 'BrandShareChart.tsx'), 'utf-8')
    expect(chart).toMatch(/yAxisId="rating"[\s\S]{0,120}orientation="right"[\s\S]{0,40}reversed/)
    expect(chart).toContain('allowDecimals={false}')
  })
  it('pins tooltip popover tokens and sr-only table presence', () => {
    const tooltip = readFileSync(join(analyticsDirectory, 'BrandShareTooltip.tsx'), 'utf-8')
    expect(tooltip).toContain('bg-popover')
    expect(tooltip).toContain('text-popover-foreground')
    expect(tooltip).toContain('border-border')
    const chart = readFileSync(join(analyticsDirectory, 'BrandShareChart.tsx'), 'utf-8')
    expect(chart).toContain('BrandShareSrTable')
  })
})
