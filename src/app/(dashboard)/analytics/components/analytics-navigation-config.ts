'use client'

/** Analytics Navigation Configuration — grouped by user intent (Story 120.2-FE restructured) */

import {
  Package,
  Tags,
  Calendar,
  BarChart3,
  Warehouse,
  PackageSearch,
  Calculator,
  ClipboardList,
  Filter,
  ShoppingBag,
  RotateCcw,
  Search,
  Megaphone,
  Brain,
  Tag,
  Layers,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes'

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

/** Helper to reduce repetition in navigation item definitions */
function nav(
  href: string,
  icon: NavigationItem['icon'],
  title: string,
  desc: string,
  hue: string,
  badge?: string
): NavigationItem {
  return {
    href,
    icon,
    title,
    description: desc,
    badge,
    color: `text-${hue}-600`,
    bgColor: `bg-${hue}-50`,
    hoverBg: `hover:bg-${hue}-100`,
    borderColor: `border-${hue}-200`,
  }
}

export const analyticsNavigation = {
  financial: {
    title: 'Финансовый анализ',
    description: 'Доходы, расходы и маржинальность',
    items: [
      nav(ROUTES.ANALYTICS.SKU, Package, 'По товарам', 'Прибыль и маржа каждого SKU', 'blue'),
      nav(ROUTES.ANALYTICS.BRAND, Tags, 'По брендам', 'Эффективность брендов', 'emerald'),
      nav(ROUTES.ANALYTICS.CATEGORY, BarChart3, 'По категориям', 'Сравнение категорий', 'violet'),
      nav(ROUTES.ANALYTICS.TIME_PERIOD, Calendar, 'По времени', 'Динамика по неделям', 'amber'),
    ],
  },
  operational: {
    title: 'Операционная аналитика',
    description: 'Склад, поставки и затраты',
    items: [
      nav(ROUTES.ANALYTICS.STORAGE, Warehouse, 'Хранение', 'Затраты на хранение по SKU', 'slate'),
      nav(
        ROUTES.ANALYTICS.SUPPLY_PLANNING,
        PackageSearch,
        'Планирование',
        'Прогноз стокаутов',
        'rose',
        'Важно'
      ),
      nav(
        ROUTES.ANALYTICS.ORDERS,
        ClipboardList,
        'Заказы FBS',
        'Анализ заказов FBS за 365 дней',
        'orange',
        'Новое'
      ),
    ],
  },
  marketing: {
    title: 'Маркетинг и SEO',
    description: 'Воронка, реклама, поиск и аналитика',
    items: [
      nav(
        ROUTES.ANALYTICS.FUNNEL,
        Filter,
        'Воронка продаж',
        'Просмотры → корзина → заказы → выкупы',
        'cyan'
      ),
      nav(
        ROUTES.ANALYTICS.ADVERTISING,
        Megaphone,
        'Реклама',
        'Кампании, ROAS и эффективность',
        'amber'
      ),
      nav(
        ROUTES.ANALYTICS.SEARCH,
        Search,
        'Поисковая аналитика',
        'Поисковые запросы, позиции и заказы',
        'sky'
      ),
      nav(
        ROUTES.ANALYTICS.BUYOUT,
        ShoppingBag,
        'Аналитика выкупов',
        'Процент выкупа и тренды по SKU',
        'teal'
      ),
      nav(
        ROUTES.ANALYTICS.RETURNS,
        RotateCcw,
        'Аналитика возвратов',
        'Причины возвратов и аномалии',
        'pink'
      ),
      nav(
        ROUTES.ANALYTICS.CROSS_REFERENCE,
        Layers,
        'Кросс-анализ',
        'Поиск + реклама: пересечение и ROI',
        'violet'
      ),
    ],
  },
  strategic: {
    title: 'Стратегический анализ',
    description: 'Юнит-экономика и AI прогнозы',
    items: [
      nav(
        ROUTES.ANALYTICS.UNIT_ECONOMICS,
        Calculator,
        'Юнит-экономика',
        'Структура затрат на единицу',
        'indigo'
      ),
      nav(
        ROUTES.ANALYTICS.FORECAST,
        Brain,
        'AI Прогноз',
        'Прогноз продаж на основе ML',
        'purple',
        'ML'
      ),
      nav(
        ROUTES.ANALYTICS.PRICING,
        Tag,
        'Рекомендации по ценам',
        'Цены для целевой маржинальности',
        'emerald'
      ),
    ],
  },
}
