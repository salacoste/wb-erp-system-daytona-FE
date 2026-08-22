import {
  ArrowRightLeft,
  Banknote,
  Eye,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from 'lucide-react'

import type { FunnelSummary } from '@/types/analytics-funnel'
import { formatCurrency } from '@/lib/utils'

import { formatNumber, formatPercent } from './funnel-summary-formatters'

export type SummaryKey = keyof FunnelSummary

export interface FunnelSummaryCardDefinition {
  label: string
  field: SummaryKey
  icon: React.ComponentType<{ className?: string }>
  color: string
  format: (value: number) => string
}

export const FUNNEL_SUMMARY_CARDS: FunnelSummaryCardDefinition[] = [
  {
    label: 'Просмотры',
    field: 'openCardCount',
    icon: Eye,
    color: 'text-chart-1',
    format: formatNumber,
  },
  {
    label: 'Корзина',
    field: 'addToCartCount',
    icon: ShoppingBag,
    color: 'text-chart-3',
    format: formatNumber,
  },
  {
    label: 'Заказы',
    field: 'ordersCount',
    icon: ShoppingCart,
    color: 'text-chart-5',
    format: formatNumber,
  },
  {
    label: 'Выкупы',
    field: 'buyoutCount',
    icon: PackageCheck,
    color: 'text-chart-4',
    format: formatNumber,
  },
  {
    label: 'Сумма выкупов',
    field: 'buyoutSumRub',
    icon: Banknote,
    color: 'text-financial-positive',
    format: formatCurrency,
  },
  {
    label: 'Конв. корзины',
    field: 'cartConversion',
    icon: ArrowRightLeft,
    color: 'text-chart-3',
    format: formatPercent,
  },
  {
    label: 'Сквозная конверсия',
    field: 'totalConversion',
    icon: TrendingUp,
    color: 'text-chart-2',
    format: formatPercent,
  },
  {
    label: 'Отмены',
    field: 'cancelCount',
    icon: XCircle,
    color: 'text-financial-negative',
    format: formatNumber,
  },
]

export function isAvailableMetric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
