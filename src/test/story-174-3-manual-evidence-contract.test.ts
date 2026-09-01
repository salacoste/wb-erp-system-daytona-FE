import { describe, expect, it } from 'vitest'

import {
  STORY_174_3_MANUAL_EVIDENCE,
  STORY_174_3_MANUAL_EVIDENCE_AUTHORITY,
  STORY_174_3_MANUAL_EVIDENCE_DISPOSITION,
} from '../../e2e/fixtures/story-174-3/manual-evidence'

describe('Story 174.3 immutable manual evidence contract', () => {
  it('records every required field without relabelling operator notes as automation', () => {
    expect(STORY_174_3_MANUAL_EVIDENCE.length).toBeGreaterThanOrEqual(8)
    expect(new Set(STORY_174_3_MANUAL_EVIDENCE.map(row => row.id)).size).toBe(
      STORY_174_3_MANUAL_EVIDENCE.length
    )

    for (const row of STORY_174_3_MANUAL_EVIDENCE) {
      for (const value of Object.values(row)) expect(String(value).trim()).not.toBe('')
      expect(row.operator).toMatch(/operator|environment capability record/i)
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(row.outcome).toMatch(/^(?:passed|environment-gap)$/)
    }
  })

  it('contains passed Chromium and Firefox keyboard/focus review', () => {
    for (const browser of ['Chromium', 'Firefox']) {
      const results = STORY_174_3_MANUAL_EVIDENCE.filter(
        row => row.browser.includes(browser) && row.outcome === 'passed'
      )
      expect(results.some(row => row.riskGroup === 'form-validation')).toBe(true)
      expect(results.some(row => row.riskGroup === 'overlay-focus')).toBe(true)
      expect(results.every(row => row.focusLifecycleResult.startsWith('PASS'))).toBe(true)
    }
  })

  it('covers mobile, desktop, light, dark, form, overlay, and data meaning risks', () => {
    const passed = STORY_174_3_MANUAL_EVIDENCE.filter(row => row.outcome === 'passed')

    expect(passed.some(row => row.viewport.startsWith('390x'))).toBe(true)
    expect(passed.some(row => row.viewport.startsWith('1280x'))).toBe(true)
    expect(passed.some(row => row.theme === 'light')).toBe(true)
    expect(passed.some(row => row.theme === 'dark')).toBe(true)
    expect([...new Set(passed.map(row => row.riskGroup))]).toEqual(
      expect.arrayContaining(['data-meaning', 'form-validation', 'overlay-focus'])
    )
  })

  it('records WebKit and real-AT limitations without making a false execution claim', () => {
    const gaps = STORY_174_3_MANUAL_EVIDENCE.filter(row => row.outcome === 'environment-gap')
    const realAt = gaps.filter(row => row.riskGroup === 'assistive-technology')

    expect(gaps.some(row => row.browser.startsWith('WebKit'))).toBe(true)
    expect(realAt).toHaveLength(2)
    expect(realAt.map(row => row.browser).join(' ')).toMatch(/VoiceOver/)
    expect(realAt.map(row => row.browser).join(' ')).toMatch(/NVDA/)
    expect(realAt.map(row => row.browser).join(' ')).toMatch(/JAWS/)
    expect(realAt.map(row => row.browser).join(' ')).toMatch(/TalkBack/)
    expect(realAt.every(row => row.primaryKeyboardPath === 'not executed')).toBe(true)
    expect(realAt.every(row => row.focusLifecycleResult.startsWith('NOT EXECUTED'))).toBe(true)
  })

  it('binds the privacy-safe substitute and environment-gap disposition to canonical authority', () => {
    expect(STORY_174_3_MANUAL_EVIDENCE_AUTHORITY.acceptance).toContain('epics-166-174')
    expect(STORY_174_3_MANUAL_EVIDENCE_AUTHORITY.browserMatrix).toContain('ux-design-specification')
    expect(STORY_174_3_MANUAL_EVIDENCE_AUTHORITY.privacySafeBaseline).toContain(
      '174.3-complete-accessibility'
    )
    expect(STORY_174_3_MANUAL_EVIDENCE_DISPOSITION).toMatchObject({
      productDefects: 'none-observed',
      unavailableEnvironments: 'recorded-non-product-gaps',
    })
    expect(STORY_174_3_MANUAL_EVIDENCE_DISPOSITION.rationale).toContain('does not substitute')
  })
})
