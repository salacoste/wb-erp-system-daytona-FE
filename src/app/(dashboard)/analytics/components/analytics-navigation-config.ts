'use client'

/**
 * Analytics Navigation Configuration
 * Extracted from analytics/page.tsx - pure structural refactoring
 * Navigation config data and types for the analytics hub
 */

import {
  Package,
  Tags,
  Calendar,
  BarChart3,
  Warehouse,
  PackageSearch,
  Calculator,
  ClipboardList,
} from 'lucide-react'
import { Filter, ShoppingBag, RotateCcw, Search } from 'lucide-react'
import { Brain } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

/**
 * Navigation item type
 */
export interface NavigationItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  hoverBg: string
  borderColor: string
  badge?: string
}

/**
 * Analytics navigation configuration
 * UX: Grouped by user intent - what question are they trying to answer?
 */
export const analyticsNavigation = {
  financial: {
    title: 'Финансовый анализ',
    description: 'Доходы, расходы и маржинальность',
    items: [
      {
        href: ROUTES.ANALYTICS.SKU,
        icon: Package,
        title: 'По товарам',
        description: 'Прибыль и маржа каждого SKU',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-100',
        borderColor: 'border-blue-200',
      },
      {
        href: ROUTES.ANALYTICS.BRAND,
        icon: Tags,
        title: 'По брендам',
        description: 'Эффективность брендов',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        hoverBg: 'hover:bg-emerald-100',
        borderColor: 'border-emerald-200',
      },
      {
        href: ROUTES.ANALYTICS.CATEGORY,
        icon: BarChart3,
        title: 'По категориям',
        description: 'Сравнение категорий',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        hoverBg: 'hover:bg-violet-100',
        borderColor: 'border-violet-200',
      },
      {
        href: ROUTES.ANALYTICS.TIME_PERIOD,
        icon: Calendar,
        title: 'По времени',
        description: 'Динамика по неделям',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        hoverBg: 'hover:bg-amber-100',
        borderColor: 'border-amber-200',
      },
    ],
  },
  operational: {
    title: 'Операционная аналитика',
    description: 'Склад, поставки и затраты',
    items: [
      {
        href: ROUTES.ANALYTICS.STORAGE,
        icon: Warehouse,
        title: 'Хранение',
        description: 'Затраты на хранение по SKU',
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        hoverBg: 'hover:bg-slate-100',
        borderColor: 'border-slate-200',
      },
      {
        href: ROUTES.ANALYTICS.SUPPLY_PLANNING,
        icon: PackageSearch,
        title: 'Планирование',
        description: 'Прогноз стокаутов',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        hoverBg: 'hover:bg-rose-100',
        borderColor: 'border-rose-200',
        badge: 'Важно',
      },
      {
        href: ROUTES.ANALYTICS.ORDERS,
        icon: ClipboardList,
        title: 'Заказы FBS',
        description: 'Анализ заказов FBS за 365 дней',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        hoverBg: 'hover:bg-orange-100',
        borderColor: 'border-orange-200',
        badge: 'Новое',
      },
      {
        href: ROUTES.ANALYTICS.FUNNEL,
        icon: Filter,
        title: 'Воронка продаж',
        description: 'Просмотры → корзина → заказы → выкупы',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        hoverBg: 'hover:bg-cyan-100',
        borderColor: 'border-cyan-200',
        badge: 'Новое',
      },
    ],
  },
  strategic: {
    title: 'Стратегический анализ',
    description: 'Юнит-экономика и рентабельность',
    items: [
      {
        href: ROUTES.ANALYTICS.UNIT_ECONOMICS,
        icon: Calculator,
        title: 'Юнит-экономика',
        description: 'Структура затрат на единицу',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        hoverBg: 'hover:bg-indigo-100',
        borderColor: 'border-indigo-200',
        badge: 'Новое',
      },
      {
        href: ROUTES.ANALYTICS.BUYOUT,
        icon: ShoppingBag,
        title: 'Аналитика выкупов',
        description: 'Процент выкупа и тренды по SKU',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        hoverBg: 'hover:bg-teal-100',
        borderColor: 'border-teal-200',
        badge: 'Новое',
      },
      {
        href: ROUTES.ANALYTICS.RETURNS,
        icon: RotateCcw,
        title: 'Аналитика возвратов',
        description: 'Причины возвратов и аномалии',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        hoverBg: 'hover:bg-pink-100',
        borderColor: 'border-pink-200',
        badge: 'Новое',
      },
      {
        href: ROUTES.ANALYTICS.SEARCH,
        icon: Search,
        title: 'Поисковая аналитика',
        description: 'Поисковые запросы, позиции и заказы',
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        hoverBg: 'hover:bg-sky-100',
        borderColor: 'border-sky-200',
        badge: 'Джем',
      },
      {
        href: ROUTES.ANALYTICS.FORECAST,
        icon: Brain,
        title: 'AI Прогноз',
        description: 'Прогноз продаж на основе ML',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        hoverBg: 'hover:bg-purple-100',
        borderColor: 'border-purple-200',
        badge: 'ML',
      },
    ],
  },
}
