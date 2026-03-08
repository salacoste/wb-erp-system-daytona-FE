import { describe, it, expect } from 'vitest'
import {
  calculateDiscrepancy,
  getDiscrepancySeverity,
  WARNING_THRESHOLD,
  DANGER_THRESHOLD,
  SEVERITY_COLORS,
  SEVERITY_BG,
  AD_COST_LAYERS,
} from '../ad-cost-discrepancy-config'

describe('getDiscrepancySeverity', () => {
  it('returns normal for ≤5%', () => {
    expect(getDiscrepancySeverity(0)).toBe('normal')
    expect(getDiscrepancySeverity(3)).toBe('normal')
    expect(getDiscrepancySeverity(5)).toBe('normal')
  })

  it('returns warning for >5% and ≤10%', () => {
    expect(getDiscrepancySeverity(5.1)).toBe('warning')
    expect(getDiscrepancySeverity(7.5)).toBe('warning')
    expect(getDiscrepancySeverity(10)).toBe('warning')
  })

  it('returns danger for >10%', () => {
    expect(getDiscrepancySeverity(10.1)).toBe('danger')
    expect(getDiscrepancySeverity(25)).toBe('danger')
    expect(getDiscrepancySeverity(100)).toBe('danger')
  })
})

describe('calculateDiscrepancy', () => {
  it('calculates delta between platform and actual', () => {
    const result = calculateDiscrepancy(95_000, 100_000)
    expect(result).not.toBeNull()
    expect(result!.comparison.percentageChange).toBe(-5)
    expect(result!.comparison.absoluteDifference).toBe(-5000)
    expect(result!.severity).toBe('normal')
  })

  it('marks warning severity for >5% delta', () => {
    const result = calculateDiscrepancy(92_000, 100_000)
    expect(result!.severity).toBe('warning')
  })

  it('marks danger severity for >10% delta', () => {
    const result = calculateDiscrepancy(85_000, 100_000)
    expect(result!.severity).toBe('danger')
  })

  it('returns null when platform is null', () => {
    expect(calculateDiscrepancy(100_000, null)).toBeNull()
  })

  it('returns null when actual is null', () => {
    expect(calculateDiscrepancy(null, 100_000)).toBeNull()
  })

  it('returns null when platform is zero', () => {
    expect(calculateDiscrepancy(100_000, 0)).toBeNull()
  })

  it('handles positive discrepancy (actual > platform)', () => {
    const result = calculateDiscrepancy(110_000, 100_000)
    expect(result!.comparison.percentageChange).toBe(10)
    expect(result!.severity).toBe('warning')
  })

  it('includes formatted percentage', () => {
    const result = calculateDiscrepancy(95_000, 100_000)
    expect(result!.comparison.formattedPercentage).toContain('5')
    expect(result!.comparison.formattedPercentage).toContain('%')
  })
})

describe('constants', () => {
  it('has correct thresholds', () => {
    expect(WARNING_THRESHOLD).toBe(5)
    expect(DANGER_THRESHOLD).toBe(10)
  })

  it('has severity colors for all levels', () => {
    expect(SEVERITY_COLORS.normal).toBeDefined()
    expect(SEVERITY_COLORS.warning).toContain('yellow')
    expect(SEVERITY_COLORS.danger).toContain('red')
  })

  it('has severity backgrounds for all levels', () => {
    expect(SEVERITY_BG.normal).toBeDefined()
    expect(SEVERITY_BG.warning).toContain('yellow')
    expect(SEVERITY_BG.danger).toContain('red')
  })
})

describe('AD_COST_LAYERS', () => {
  it('has 3 layers', () => {
    expect(AD_COST_LAYERS).toHaveLength(3)
  })

  it('platform and actual are available', () => {
    const platform = AD_COST_LAYERS.find(l => l.key === 'platform')
    const actual = AD_COST_LAYERS.find(l => l.key === 'actual')
    expect(platform?.available).toBe(true)
    expect(actual?.available).toBe(true)
  })

  it('corrected is not yet available', () => {
    const corrected = AD_COST_LAYERS.find(l => l.key === 'corrected')
    expect(corrected?.available).toBe(false)
  })
})
