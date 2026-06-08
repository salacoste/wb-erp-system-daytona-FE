/**
 * BaseMetricCard helpers — extracted for line-count compliance.
 * formatValue and getSentimentClasses used by BaseMetricCard component.
 */

import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { TrendDirection } from '@/lib/comparison-helpers'

export type MetricFormat = 'currency' | 'percent' | 'number' | 'days'

export function formatValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return formatPercentage(value)
    case 'number':
      return new Intl.NumberFormat('ru-RU').format(value)
    case 'days':
      return `${value} дн.`
  }
}

export function getSentimentClasses(direction: TrendDirection): string {
  if (direction === 'positive') return 'bg-green-50 border-green-200'
  if (direction === 'negative') return 'bg-red-50 border-red-200'
  return ''
}
