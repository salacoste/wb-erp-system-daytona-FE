/**
 * Monitoring API query keys — Epic 68-FE (Story 68.1)
 * Follows project pattern: hierarchical arrays for TanStack Query v5
 */

import type { GridParams } from '@/app/(dashboard)/monitoring/types/monitoring'

export const monitoringQueryKeys = {
  all: ['monitoring'] as const,

  // Epic 67: Dashboard summary
  dashboard: (cabinetId: string) => [...monitoringQueryKeys.all, 'dashboard', cabinetId] as const,

  // Epic 67: Pipeline health grid (heatmap)
  grid: (cabinetId: string, params: GridParams) =>
    [...monitoringQueryKeys.all, 'grid', cabinetId, params] as const,

  // Epic 67: Telegram health
  telegram: (cabinetId: string) => [...monitoringQueryKeys.all, 'telegram', cabinetId] as const,

  // Epic 49: Recovery status
  recovery: (cabinetId: string) => [...monitoringQueryKeys.all, 'recovery', cabinetId] as const,

  // Epic 49: Health reports list
  healthReports: (cabinetId: string, days: number) =>
    [...monitoringQueryKeys.all, 'reports', cabinetId, days] as const,

  // Epic 49: Single health report
  healthReport: (cabinetId: string, date: string) =>
    [...monitoringQueryKeys.all, 'report', cabinetId, date] as const,

  // Epic 49: Data completeness detail
  dataCompleteness: (cabinetId: string) =>
    [...monitoringQueryKeys.all, 'completeness', cabinetId] as const,

  // Epic 49: Missing dates for a table
  missingDates: (cabinetId: string, table: string) =>
    [...monitoringQueryKeys.all, 'missing', cabinetId, table] as const,
}
