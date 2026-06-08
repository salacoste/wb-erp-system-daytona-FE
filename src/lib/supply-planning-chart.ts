/**
 * Supply Planning Chart Data Helpers
 * Extracted from supply-planning-utils.ts for file size compliance
 */

import type { RiskDistributionData, SupplyPlanningSummary } from '@/types/supply-planning'

import { STOCKOUT_RISK_CONFIG as RISK_CONFIG } from './supply-planning-config'

/**
 * Generate risk distribution data for pie/donut chart
 * Uses colors from STOCKOUT_RISK_CONFIG for consistency
 */
export function getRiskDistributionData(summary: SupplyPlanningSummary): RiskDistributionData[] {
  const data: RiskDistributionData[] = [
    {
      status: 'out_of_stock',
      count: summary.out_of_stock_count,
      label: RISK_CONFIG.out_of_stock.label,
      color: RISK_CONFIG.out_of_stock.color,
    },
    {
      status: 'critical',
      count: summary.stockout_critical,
      label: RISK_CONFIG.critical.label,
      color: RISK_CONFIG.critical.color,
    },
    {
      status: 'warning',
      count: summary.stockout_warning,
      label: RISK_CONFIG.warning.label,
      color: RISK_CONFIG.warning.color,
    },
    {
      status: 'low',
      count: summary.stockout_low,
      label: RISK_CONFIG.low.label,
      color: RISK_CONFIG.low.color,
    },
    {
      status: 'healthy',
      count: summary.healthy_stock,
      label: RISK_CONFIG.healthy.label,
      color: RISK_CONFIG.healthy.color,
    },
  ]

  // Filter out zero counts for cleaner chart
  return data.filter(d => d.count > 0)
}
