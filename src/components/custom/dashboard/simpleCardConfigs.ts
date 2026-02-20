/**
 * Simple metric card configurations for DashboardMetricsGrid.
 * Data-driven card definitions: orders, sales, returns, net sales.
 */

import { ShoppingCart, TrendingUp, RotateCcw, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { SimpleMetricCardProps } from './SimpleMetricCard'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

const fmt = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))
const fmtPcs = (v: number | undefined | null) => (v != null ? `${fmt(v)} шт` : '—')
const fmtRub = (v: number | undefined | null) => (v != null ? formatCurrency(v) : '—')

type CardConfig = Omit<SimpleMetricCardProps, 'isLoading' | 'error' | 'onRetry'>

/** Build array of simple metric card configs from grid props */
export function buildSimpleCards(p: DashboardMetricsGridProps): CardConfig[] {
  const prev = p.previousPeriodData
  return [
    {
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      title: 'Заказы, шт',
      value: fmtPcs(p.totalOrders),
      valueColor: 'text-blue-600',
      current: p.totalOrders,
      previous: prev?.ordersCount,
      tooltip: 'Общее количество заказов FBO и FBS за период',
    },
    {
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      title: 'Заказы, ₽',
      value: fmtRub(p.ordersRevenue),
      valueColor: 'text-blue-600',
      current: p.ordersRevenue,
      previous: prev?.ordersAmount,
      tooltip: 'Сумма заказов по розничной цене (до удержаний WB)',
      subtitle: 'розничная цена',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-green-500',
      title: 'Выкупы, ₽',
      value: fmtRub(p.wbSalesGross),
      valueColor: 'text-green-600',
      current: p.wbSalesGross,
      previous: prev?.salesAmount,
      tooltip: 'Сумма выкупленных товаров из еженедельного отчёта WB',
    },
    {
      icon: Package,
      iconColor: 'text-green-500',
      title: 'Выкупы, шт',
      value: fmtPcs(p.salesCount),
      valueColor: 'text-green-600',
      tooltip: 'Количество выкупленных товаров (FBO + FBS)',
    },
    {
      icon: RotateCcw,
      iconColor: 'text-red-500',
      title: 'Возвраты, ₽',
      value: fmtRub(p.wbReturnsGross),
      valueColor: 'text-red-600',
      tooltip: 'Сумма возвратов из еженедельного отчёта WB',
    },
    {
      icon: RotateCcw,
      iconColor: 'text-red-500',
      title: 'Возвраты, шт',
      value: fmtPcs(p.returnsCount),
      valueColor: 'text-red-600',
      tooltip: 'Количество возвращённых товаров (FBO + FBS)',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-green-500',
      title: 'Продажи (розница)',
      value: fmtRub(p.saleGross),
      valueColor: 'text-green-600',
      current: p.saleGross,
      previous: prev?.saleGross,
      tooltip: 'Выкупы минус возвраты. Розничная стоимость проданных товаров.',
    },
  ]
}
