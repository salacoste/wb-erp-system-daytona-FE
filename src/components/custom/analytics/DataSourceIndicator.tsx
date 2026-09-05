/**
 * DataSourceIndicator Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Badge showing the data source with color coding:
 * - "Реалтайм" (orders_fbs, 0-30 days) - green
 * - "Ежедневно" (reports, 31-90 days) - blue
 * - "Еженедельно" (analytics, 91-365 days) - purple
 */

import { cn } from '@/lib/utils'
import type { DataSourceInfo } from '@/types/fbs-analytics'

// ============================================================================
// Data Source Configuration
// ============================================================================

interface DataSourceConfig {
  label: string
  colorClass: string
  description: string
}

// Wave-4 boundary sweep (debt/p2-w4-component-families): semantic status tokens, W2a
// pattern on card mount (FbsTrendsChart surface). Measured both themes over card
// (harness /tmp/p2-w4-contrast.mjs): success/5 4.80/8.72 (success/10 = 4.49 light FAIL
// -> /5 per house rule), information/10 4.98/7.32, pending/10 7.87/6.83 — all AA.
const DATA_SOURCE_CONFIG: Record<DataSourceInfo['primary'], DataSourceConfig> = {
  orders_fbs: {
    label: 'Реалтайм',
    colorClass: 'bg-status-success/5 text-status-success border-status-success/20',
    description: 'Данные из API заказов FBS (последние 30 дней)',
  },
  reports: {
    label: 'Ежедневно',
    colorClass: 'bg-status-information/10 text-status-information border-status-information/20',
    description: 'Ежедневные отчёты (31-90 дней)',
  },
  analytics: {
    label: 'Еженедельно',
    colorClass: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    description: 'Еженедельные агрегаты (91-365 дней)',
  },
}

// ============================================================================
// Component Props
// ============================================================================

interface DataSourceIndicatorProps {
  /** Data source from API response */
  source: DataSourceInfo['primary']
  /** Show tooltip with description on hover */
  showTooltip?: boolean
  /** Additional class names */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Displays a colored badge indicating the data source type
 *
 * @example
 * <DataSourceIndicator source="orders_fbs" />
 * <DataSourceIndicator source="reports" showTooltip />
 */
export function DataSourceIndicator({
  source,
  showTooltip = false,
  className,
}: DataSourceIndicatorProps) {
  const config = DATA_SOURCE_CONFIG[source] ?? DATA_SOURCE_CONFIG.orders_fbs

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5',
        'text-xs font-medium',
        config.colorClass,
        className
      )}
      title={showTooltip ? config.description : undefined}
      aria-label={`Источник данных: ${config.label}`}
    >
      {config.label}
    </span>
  )
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Get configuration for a data source
 * Useful for custom rendering or testing
 */
export function getDataSourceConfig(source: DataSourceInfo['primary']): DataSourceConfig {
  return DATA_SOURCE_CONFIG[source] ?? DATA_SOURCE_CONFIG.orders_fbs
}

/**
 * Get label for a data source
 */
export function getDataSourceBadgeLabel(source: DataSourceInfo['primary']): string {
  return getDataSourceConfig(source).label
}
