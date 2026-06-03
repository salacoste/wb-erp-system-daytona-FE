import { describe, it, expect } from 'vitest'
import { normalizeJamStatusResponse } from '../cabinet-normalizer'
import { JAM_TIER_LABELS, JAM_TIER_LEVEL, type JamTier } from '@/types/cabinet'

// iter-96: toJamTier coerces unrecognised backend tiers to 'unknown'. 'unknown' MUST be a JamTier
// member with label/style/level coverage — else CabinetInfoCard/Sidebar render a blank, unstyled
// badge (Defensive Frontend: indicate the anomaly, don't show nothing).
describe('normalizeJamStatusResponse — JamTier coercion', () => {
  it('coerces an unrecognised backend tier to "unknown"', () => {
    expect(normalizeJamStatusResponse({ tier: 'premium', available: true }).tier).toBe('unknown')
  })

  it('passes through known tiers', () => {
    expect(normalizeJamStatusResponse({ tier: 'advanced' }).tier).toBe('advanced')
    expect(normalizeJamStatusResponse({ tier: 'none' }).tier).toBe('none')
    expect(normalizeJamStatusResponse({ tier: 'standard' }).tier).toBe('standard')
  })

  it('defaults a missing tier to "unknown" (not a blank/invalid value)', () => {
    expect(normalizeJamStatusResponse({}).tier).toBe('unknown')
  })
})

describe('JamTier maps cover every tier (no blank badge)', () => {
  const tiers: JamTier[] = ['none', 'standard', 'advanced', 'unknown']

  it('every tier has a non-empty label and a numeric level', () => {
    for (const t of tiers) {
      expect(JAM_TIER_LABELS[t]).toBeTruthy()
      expect(typeof JAM_TIER_LEVEL[t]).toBe('number')
    }
  })

  it('"unknown" is fail-closed (level 0 — never satisfies a standard/advanced gate)', () => {
    expect(JAM_TIER_LEVEL.unknown).toBe(0)
    expect(JAM_TIER_LEVEL.unknown).toBeLessThan(JAM_TIER_LEVEL.standard)
  })
})
