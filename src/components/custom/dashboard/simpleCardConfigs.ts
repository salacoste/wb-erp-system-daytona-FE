/**
 * Simple metric card configurations for DashboardMetricsGrid.
 * Data-driven card definitions: orders count, buyouts count, returns.
 *
 * WB Price Chain (две ценовые шкалы):
 * РРЦ → скидка продавца → Цена на карточке (база комиссии WB)
 *   Розничный: sales_gross − returns_gross = saleGross (Продажи розница)
 *   Поставщик: × (1−комиссия) = wbSalesGross (Выкупы) − wbReturnsGross (Возвраты)
 * ⚠ saleGross ≠ wbSalesGross − wbReturnsGross (разные ценовые уровни!)
 *
 * TZ-3: the 4 revenue-by-price-level cards (Заказы РРЦ, Заказы со скидкой, Выкупы ₽,
 * Продажи розница) moved to SalesByPriceLevelCard. The count/returns cards remain here.
 */

import { ShoppingCart, Package, RotateCcw } from 'lucide-react'
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
      tooltip:
        'Сколько товаров заказали покупатели за период (FBO + FBS).\nВключает все заказы — даже те, которые ещё не выкуплены или будут отменены.\nИсточник: данные о заказах WB.',
    },
    {
      icon: Package,
      iconColor: 'text-green-500',
      title: 'Выкупы, шт',
      value: fmtPcs(p.salesCount),
      valueColor: 'text-green-600',
      tooltip:
        'Количество выкупленных товаров за период.\nВключает все каналы: FBO, FBS и EAEU.\nИсточник: еженедельный финансовый отчёт WB (product_transactions).',
    },
    {
      icon: RotateCcw,
      iconColor: 'text-red-500',
      title: 'Возвраты',
      value: `${fmtPcs(p.returnsCount)} / ${fmtRub(p.wbReturnsGross)}`,
      valueColor: 'text-red-600',
      current: p.returnsCount,
      tooltip:
        'Возвраты за период в штуках и ₽.\nШтуки: количество возвращённых товаров (FBO + FBS), источник — fulfillment.\n₽: сколько WB удержал за возвращённые товары на уровне поставщика, источник — еженедельный финансовый отчёт WB.\nРозничная стоимость возвратов выше, так как не учитывает комиссию WB.',
      subtitle: 'шт / ₽',
    },
  ]
}
