import type { Cabinet } from '@/types/cabinet'
import type { TaxMetrics } from '@/types/finance-summary-sub-types'

export interface DashboardMetricsLoadingState {
  isFinanceAvailable: boolean
  financialLoading: boolean
  fulfillmentLoading: boolean
  advertisingLoading: boolean
  hasFinancialData: boolean
  hasFulfillmentData: boolean
  hasAdvertisingData: boolean
}

export function shouldShowDashboardMetricsSkeleton({
  isFinanceAvailable,
  financialLoading,
  fulfillmentLoading,
  advertisingLoading,
  hasFinancialData,
  hasFulfillmentData,
  hasAdvertisingData,
}: DashboardMetricsLoadingState): boolean {
  const hasPrimaryMetricsData = hasFinancialData || hasFulfillmentData || hasAdvertisingData
  const isPrimaryMetricsLoading =
    (isFinanceAvailable && financialLoading) || fulfillmentLoading || advertisingLoading

  return isPrimaryMetricsLoading && !hasPrimaryMetricsData
}

export interface DashboardTaxConfigurationState {
  effectiveTaxMetrics: TaxMetrics | null | undefined
  cabinetTaxSettings: Pick<Cabinet, 'taxSystem'> | null | undefined
  taxSettingsLoading: boolean
  taxSettingsError: boolean
  cabinetId: string | null
}

export function isDashboardTaxConfigured({
  effectiveTaxMetrics,
  cabinetTaxSettings,
  taxSettingsLoading,
  taxSettingsError,
  cabinetId,
}: DashboardTaxConfigurationState): boolean {
  if (effectiveTaxMetrics != null) return true
  if (cabinetTaxSettings != null) return cabinetTaxSettings.taxSystem != null

  // Do not show "not configured" while the configuration state is still unknown.
  // The banner is only valid after a successful settings response proves taxSystem is null.
  if (!cabinetId || taxSettingsLoading || taxSettingsError) return true

  return false
}
