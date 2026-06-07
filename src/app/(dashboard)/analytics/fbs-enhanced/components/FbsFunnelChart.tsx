/**
 * FBS Funnel Chart — conversion metrics display
 * Epic 129-FE Story 129.2: 2 conversion rates from backend per Request #202.
 *
 * The old 4-stage SVG funnel (views→cart→orders→deliveries) is replaced with
 * two simple metric rows: addToCartPercent and ordersPercent.
 * No recharts or SVG geometry needed — just styled metric cards.
 *
 * Pattern: KpiRow — lightweight inline metric display without Card wrapper.
 */

import type { FbsFunnelData } from '@/types/fbs-enhanced'

export interface FunnelMetric {
  label: string
  value: number | null
  description: string
}

/** Extract the two conversion metrics from funnel data. */
export function buildMetrics(data: FbsFunnelData): [FunnelMetric, FunnelMetric] {
  return [
    {
      label: 'Конверсия в корзину',
      value: data.addToCartPercent,
      description: 'Доля добавлений в корзину от просмотров',
    },
    {
      label: 'Конверсия в заказ',
      value: data.ordersPercent,
      description: 'Доля заказов от просмотров',
    },
  ]
}
