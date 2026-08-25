/**
 * Story 170.2 source contracts — campaign bid-recommendation detail.
 *
 * Guard surface (2 production files, exclusively owned by this story):
 * - src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx
 * - src/components/custom/advertising/BidRecommendationsCard.tsx
 *
 * C4 DISPOSITIONS (Task 1 evidence):
 * - invalid ID — TESTED: route page.test.tsx «Некорректный ID кампании» ×2.
 * - cabinet missing — TESTED: route page.test.tsx skeleton lock.
 * - no-nmId / loading / error(incl. !data) — TESTED: card tests (3 suites).
 * - not-found/unauthorized — N/A-SPLIT: hook exposes no status split; single
 *   destructive branch (hook isError) — intentional, no separate UI state.
 * - partial (keywords absent) — TESTED: card empty/omitted keywords branches.
 * - stale — TESTED: cacheAge indicator (мин/ч/только что/invalid-hidden).
 * - consequential bid actions — N/A: card renders recommendations only;
 *   no bid-mutating action exists (AC-2 tail).
 *
 * Hex guard: 170.1 canon 3-branch regex (quoted/arbitrary, after ':',
 * 6/8-digit after whitespace). «Кампания #12345» (5-digit ID prose) is exempt
 * by design — verified in the self-test below.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BID_LEVEL_COLORS } from '../BidRecommendationsCard'

const PAGE_PATH = join(
  process.cwd(),
  'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx'
)
const CARD_PATH = join(
  process.cwd(),
  'src/components/custom/advertising/BidRecommendationsCard.tsx'
)
const OWNED_FILES = [PAGE_PATH, CARD_PATH]

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

// 170.1 canon (ac81d106 round-1 F4): quoted/arbitrary values, unquoted after
// ':', and 6/8-digit unquoted after whitespace. 3/4/5-digit prose (#12345)
// never matches any branch.
const CONTEXTUAL_HEX = new RegExp(
  [
    String.raw`(?<!=\s*)(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])`,
    String.raw`(?<=:)\s*#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
    String.raw`(?<=\s)#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![\w-])`,
  ].join('|')
)

const RGBA_HSL = /(?:rgba?\(|hsla?\()\s*\d/

describe('Story 170.2 campaign-detail source contracts', () => {
  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke|scrollbar-thumb|scrollbar-track|decoration|outline|divide)-(?:gray|grey|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone|fuchsia|pink|violet|cyan)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
    for (const file of OWNED_FILES) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw hex literals or rgba()/hsl() colors', () => {
    for (const file of OWNED_FILES) {
      const src = withoutComments(readFileSync(file, 'utf8'))
      expect(src, `${file} hex`).not.toMatch(CONTEXTUAL_HEX)
      expect(src, `${file} rgba/hsl`).not.toMatch(RGBA_HSL)
    }
  })

  it('hex guard self-test: rejects colors, exempts 5-digit campaign-ID prose (170.1 canon)', () => {
    expect(CONTEXTUAL_HEX.test("stroke: '#EEEEEE'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('className="bg-[#1A2B3C]"')).toBe(true)
    expect(CONTEXTUAL_HEX.test('stroke: #EEEEEE')).toBe(true)
    expect(CONTEXTUAL_HEX.test('stroke: #abc')).toBe(true)
    expect(CONTEXTUAL_HEX.test('fill #AABBCC')).toBe(true)
    // Story 170.2 NB: «Кампания #12345» — 5 digits after whitespace, no branch
    expect(CONTEXTUAL_HEX.test('<h1>Кампания #{advertId}</h1> // #12345')).toBe(false)
    // Ticket prose + URL fragments stay exempt (canon)
    expect(CONTEXTUAL_HEX.test('// see request #161')).toBe(false)
    expect(CONTEXTUAL_HEX.test('href="#section"')).toBe(false)
  })

  it('bid-level tokens: 3 semantic matched pairs (muted / information / success)', () => {
    expect(BID_LEVEL_COLORS.default).toBe('bg-muted/50 border-border')
    expect(BID_LEVEL_COLORS.blue).toBe('bg-status-information/15 border-status-information/30')
    expect(BID_LEVEL_COLORS.green).toBe('bg-status-success/15 border-status-success/30')
  })

  it('tier-distinctness: 3 distinct tier classes, default neutral (not success)', () => {
    const values = Object.values(BID_LEVEL_COLORS)
    expect(values).toHaveLength(3)
    expect(new Set(values).size).toBe(3)
    // Neutral default must never read as "healthy green"
    expect(BID_LEVEL_COLORS.default).not.toContain('status-success')
  })

  it('BackLink is a plain semantic Link (supplies/[id] canon) — no nested Button', () => {
    const page = withoutComments(readFileSync(PAGE_PATH, 'utf8'))
    expect(page).not.toMatch(/<Button/) // no nested interactive
    // Round-1 F1: pin the CONTRACT (href + text-link classes present), not the exact
    // className ordering — verbatim-string pins cry wolf on formatter tweaks and get weakened.
    expect(page).toMatch(/href=\{ROUTES\.ANALYTICS\.ADVERTISING\}/)
    expect(page).toMatch(/text-muted-foreground hover:text-foreground/)
  })

  it('keywords section accessible name: h4 id + container aria-labelledby', () => {
    const card = withoutComments(readFileSync(CARD_PATH, 'utf8'))
    expect(card).toMatch(/id="bid-keywords-heading"/)
    expect(card).toMatch(/aria-labelledby="bid-keywords-heading"/)
  })
})
