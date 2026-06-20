import { describe, expect, it } from 'vitest'
import { isDashboardTaxConfigured, shouldShowDashboardMetricsSkeleton } from '../useDashboardData'

describe('shouldShowDashboardMetricsSkeleton', () => {
  const base = {
    isFinanceAvailable: true,
    financialLoading: false,
    fulfillmentLoading: false,
    advertisingLoading: false,
    hasFinancialData: false,
    hasFulfillmentData: false,
    hasAdvertisingData: false,
  }

  it('keeps the full skeleton only for initial loading with no primary metrics data', () => {
    expect(
      shouldShowDashboardMetricsSkeleton({
        ...base,
        financialLoading: true,
        fulfillmentLoading: true,
      })
    ).toBe(true)
  })

  it('does not blank the metrics grid when fulfillment data is already available', () => {
    expect(
      shouldShowDashboardMetricsSkeleton({
        ...base,
        financialLoading: true,
        hasFulfillmentData: true,
      })
    ).toBe(false)
  })

  it('does not blank the metrics grid for advertising-only refreshes', () => {
    expect(
      shouldShowDashboardMetricsSkeleton({
        ...base,
        advertisingLoading: true,
        hasFinancialData: true,
      })
    ).toBe(false)
  })
})

describe('isDashboardTaxConfigured', () => {
  it('treats cabinet tax settings as configured even when period tax metrics are absent', () => {
    expect(
      isDashboardTaxConfigured({
        effectiveTaxMetrics: null,
        cabinetTaxSettings: { taxSystem: 'usn6' },
        taxSettingsLoading: false,
        taxSettingsError: false,
        cabinetId: 'cab-1',
      })
    ).toBe(true)
  })

  it('shows unconfigured only after settings are loaded with taxSystem null', () => {
    expect(
      isDashboardTaxConfigured({
        effectiveTaxMetrics: null,
        cabinetTaxSettings: { taxSystem: null },
        taxSettingsLoading: false,
        taxSettingsError: false,
        cabinetId: 'cab-1',
      })
    ).toBe(false)
  })

  it('does not show a false warning while tax settings are still loading', () => {
    expect(
      isDashboardTaxConfigured({
        effectiveTaxMetrics: null,
        cabinetTaxSettings: undefined,
        taxSettingsLoading: true,
        taxSettingsError: false,
        cabinetId: 'cab-1',
      })
    ).toBe(true)
  })
})
