/**
 * KPI Card Helpers — extracted for 200-line file limit compliance
 * Story 6.4-FE: Cabinet Summary Dashboard
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import type { TrendDirection } from '@/types/analytics'
import type { KPIFormat } from './KPICard'

/**
 * Format value based on format type
 */
export function formatValue(value: number | null | undefined, format: KPIFormat): string {
  if (value === null || value === undefined) {
    return '—'
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }).format(value)

    case 'percent':
      return formatPercentage(value, 1)

    case 'number':
      return new Intl.NumberFormat('ru-RU').format(value)

    default:
      return String(value)
  }
}

/**
 * Get trend icon component
 */
export function getTrendIcon(trend: TrendDirection | undefined) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4" />
    case 'down':
      return <TrendingDown className="h-4 w-4" />
    case 'stable':
      return <Minus className="h-4 w-4" />
    default:
      return null
  }
}

/**
 * Get trend color class
 */
export function getTrendColor(trend: TrendDirection | undefined): string {
  switch (trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-400'
    default:
      return ''
  }
}
