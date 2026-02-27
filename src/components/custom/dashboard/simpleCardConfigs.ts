/**
 * Simple metric card configurations for DashboardMetricsGrid.
 * Data-driven card definitions: orders, sales, returns, net sales.
 *
 * WB Price Chain (две ценовые шкалы):
 * РРЦ → скидка продавца → Цена на карточке (база комиссии WB)
 *   Розничный: sales_gross − returns_gross = saleGross (Продажи розница)
 *   Поставщик: × (1−комиссия) = wbSalesGross (Выкупы) − wbReturnsGross (Возвраты)
 * ⚠ saleGross ≠ wbSalesGross − wbReturnsGross (разные ценовые уровни!)
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
      tooltip:
        'Сколько товаров заказали покупатели за период (FBO + FBS).\nВключает все заказы — даже те, которые ещё не выкуплены или будут отменены.\nИсточник: данные о заказах WB.',
    },
    {
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      title: 'Заказы (РРЦ), ₽',
      value: fmtRub(p.ordersRevenue),
      valueColor: 'text-blue-600',
      current: p.ordersRevenue,
      previous: prev?.ordersAmount,
      tooltip:
        'Сумма заказов по РРЦ — рекомендованной розничной цене, которую вы устанавливаете в каталоге WB.\nЭто полная цена до вашей скидки и до комиссии WB — самая высокая из всех ценовых метрик.\nНе отражает реальную выручку — для этого смотрите «Выкупы, ₽».\nИсточник: данные о заказах WB (FBO + FBS).',
      subtitle: 'полная цена каталога',
    },
    {
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      title: 'Заказы (со скидкой), ₽',
      value: fmtRub(p.ordersRevenueDiscounted),
      valueColor: 'text-blue-600',
      current: p.ordersRevenueDiscounted,
      previous: undefined,
      tooltip:
        'Сумма заказов по цене на карточке — то, что видит покупатель на WB после вашей скидки.\nИменно эта цена является базой для расчёта комиссии WB и ваших выплат.\nЦепочка: РРЦ × (1 − ваша скидка) = цена на карточке.\nИсточник: данные о заказах WB (FBO + FBS).',
      subtitle: 'цена на карточке',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-green-500',
      title: 'Выкупы, ₽',
      value: fmtRub(p.wbSalesGross),
      valueColor: 'text-green-600',
      current: p.wbSalesGross,
      previous: prev?.salesAmount,
      tooltip:
        'Сколько WB начислил вам за выкупленные товары — уже после удержания комиссии WB (≈20–40%).\nЭто ваша реальная выручка от продаж, но до вычета логистики, хранения и других расходов.\nЦепочка: Цена на карточке × (1 − комиссия WB) = Выкупы.\n⚠ Не путать с «Продажи (розница)» — там сумма по розничной цене покупателя.\nИсточник: еженедельный финансовый отчёт WB.',
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
      title: 'Возвраты, ₽',
      value: fmtRub(p.wbReturnsGross),
      valueColor: 'text-red-600',
      tooltip:
        'Сколько WB удержал за возвращённые товары — на том же ценовом уровне, что и «Выкупы» (уже после комиссии WB).\nРозничная стоимость возвратов выше, так как не учитывает комиссию.\nПример: покупатель вернул товар за 1000₽ по рознице → WB удержит с вас ~650₽ (за вычетом своей комиссии).\nИсточник: еженедельный финансовый отчёт WB.',
    },
    {
      icon: RotateCcw,
      iconColor: 'text-red-500',
      title: 'Возвраты, шт',
      value: fmtPcs(p.returnsCount),
      valueColor: 'text-red-600',
      tooltip:
        'Количество возвращённых товаров за период (FBO + FBS).\nИсточник: данные о заказах WB (fulfillment).',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-green-500',
      title: 'Продажи (розница)',
      value: fmtRub(p.saleGross),
      valueColor: 'text-green-600',
      current: p.saleGross,
      previous: prev?.saleGross,
      tooltip:
        'Объём продаж по розничной цене: сколько покупатели заплатили за товары, минус стоимость возвратов.\nЭто розничная цена (то, что платит покупатель), а НЕ ваша выручка как продавца.\nФормула: Продажи по рознице − Возвраты по рознице.\n⚠ Не совпадает с «Выкупы − Возвраты»: те считаются после комиссии WB, а эта метрика — до.\nВаша реальная выручка — это «Выкупы, ₽».\nИсточник: еженедельный финансовый отчёт WB.',
    },
  ]
}
