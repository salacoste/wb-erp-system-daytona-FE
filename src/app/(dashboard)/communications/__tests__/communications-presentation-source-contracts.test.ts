/**
 * Story 172.9 micro-guards — Communications workspace (owned surface: the
 * /communications route tree only; hooks/API/types are forbidden shared files).
 * Catalog pinned (route prod files, per-file identity); no-palette/no-hex over
 * the catalog; semantic-token contract pins (status-success/error valence,
 * destructive writeback alerts + unread counter, primary seller bubble,
 * status-warning rating stars, ghost ui-Button thread rows); tabular-nums;
 * route-level padding pin. 169.11 regex canon; anchor-safe relative-first
 * enumeration (171.8/172.3 lessons).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite's test transform rewrites static new URL(str, import.meta.url) — use
// resolve(fileURLToPath(import.meta.url)) instead (170.6 canon).
const routeDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function routeProdFiles(): string[] {
  return (
    readdirSync(routeDirectory, { recursive: true })
      .map(f => f as string)
      // Anchor-safe (171.8/172.3): filter RELATIVE entries BEFORE join;
      // separator-anchored test-dir exclusion (nested included).
      .filter(f => !f.startsWith('__tests__/') && !f.includes('/__tests__/'))
      .filter(f => !/\.(?:test|spec)\./.test(f))
      .filter(f => /\.(?:ts|tsx)$/.test(f))
      .map(f => join(routeDirectory, f))
      .sort()
  )
}

const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/
const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/

function component(name: string): string {
  return join(routeDirectory, 'components', name)
}

describe('Story 172.9 communications presentation source contracts', () => {
  it('catalog pinned (18 route files, per-file identity)', () => {
    const route = routeProdFiles()
    expect(route).toHaveLength(18)
    for (const name of [
      'page.tsx',
      'ChatComposer.tsx',
      'ChatMessages.tsx',
      'ChatsSection.tsx',
      'ClaimsSection.tsx',
      'ConfirmAction.tsx',
      'FeedbackRow.tsx',
      'FeedbacksSection.tsx',
      'FeedbackWriteControls.tsx',
      'PinnedReviewsSection.tsx',
      'PinnedWriteControls.tsx',
      'QuestionRow.tsx',
      'QuestionsSection.tsx',
      'QuestionWriteControls.tsx',
      'ReplyForm.tsx',
      'SectionState.tsx',
      'UnreadBadge.tsx',
      'WritebackStatus.tsx',
    ]) {
      expect(
        route.some(f => f.endsWith(name)),
        name
      ).toBe(true)
    }
  })

  it('no legacy palette classes in any production file', () => {
    for (const f of routeProdFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(LEGACY_PALETTE)
    }
  })

  it('no hex color literals (self-tested regex: quoted value caught, ticket ref exempt)', () => {
    expect(CONTEXTUAL_HEX.test("color: '#3B82F6'")).toBe(true)
    expect(CONTEXTUAL_HEX.test('see ticket #197 covers this')).toBe(false)
    for (const f of routeProdFiles()) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(CONTEXTUAL_HEX)
    }
  })

  it('valence pin: answer/state status uses status-success and status-error tokens', () => {
    for (const name of ['QuestionRow.tsx', 'FeedbackRow.tsx', 'PinnedReviewsSection.tsx']) {
      const src = readFileSync(component(name), 'utf8')
      expect(src, `${name} success`).toMatch(/text-status-success/)
      expect(src, `${name} error`).toMatch(/text-status-error/)
    }
  })

  it('seller-bubble pin: seller message on brand tokens, client on muted', () => {
    const src = readFileSync(component('ChatMessages.tsx'), 'utf8')
    expect(src).toMatch(
      /isSeller \? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'/
    )
  })

  it('unread pins: header dot and thread counter on destructive tokens', () => {
    expect(readFileSync(component('UnreadBadge.tsx'), 'utf8')).toMatch(
      /rounded-full bg-destructive/
    )
    expect(readFileSync(component('ChatsSection.tsx'), 'utf8')).toMatch(
      /rounded-full bg-destructive px-1\.5 text-xs font-medium text-destructive-foreground/
    )
  })

  it('rating pin: stars fill on status-warning token (nullable stays muted dash)', () => {
    const src = readFileSync(component('FeedbacksSection.tsx'), 'utf8')
    expect(src).toMatch(/fill-status-warning text-status-warning/)
    expect(src).toMatch(/text-muted-foreground">—/)
  })

  it('writeback pin: all five alert lines are destructive (exact inventory)', () => {
    const src = readFileSync(component('WritebackStatus.tsx'), 'utf8')
    // Format-stable inventory: five alerts, five destructive tokens (the long
    // jobError line is prettier-wrapped multi-line, so count tokens, not lines).
    const alerts = src.match(/role="alert"/g) ?? []
    expect(alerts).toHaveLength(5)
    const destructive = src.match(/text-destructive/g) ?? []
    expect(destructive).toHaveLength(5)
    // The in-flight line stays muted (never an error color while pending).
    expect(src).toMatch(/role="status"/)
    expect(src).toMatch(/text-muted-foreground/)
  })

  it('thread-row pin: rows are ghost ui-Buttons with named conversation action', () => {
    const src = readFileSync(component('ChatsSection.tsx'), 'utf8')
    expect(src).toMatch(/<Button\s/)
    expect(src).toMatch(/variant="ghost"/)
    expect(src).toMatch(/aria-label=\{`Открыть беседу /)
    expect(src).not.toMatch(/<button/)
  })

  it('tabular-nums pin: message and thread timestamps align digits', () => {
    expect(readFileSync(component('ChatMessages.tsx'), 'utf8')).toMatch(/tabular-nums/)
    expect(readFileSync(component('ChatsSection.tsx'), 'utf8')).toMatch(/tabular-nums/)
  })

  it('padding pin: no route-level outer padding (dashboard layout provides it)', () => {
    const page = readFileSync(join(routeDirectory, 'page.tsx'), 'utf8')
    expect(page).not.toMatch(/\bp-6\b|\bpx-6\b|\bpt-6\b|\bpy-6\b/)
    // NOTE: SectionState's empty-message py-6 is INTRA-card vertical breathing
    // for a centered one-line placeholder, not route-level chrome — deliberately
    // out of this pin (172.7 intra-card precedent).
  })
})
