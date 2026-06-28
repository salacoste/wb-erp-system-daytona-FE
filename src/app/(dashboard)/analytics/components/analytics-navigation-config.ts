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
  Boxes,
  FileCheck,
  ArrowLeftRight,
  Truck,
  Bell,
  FileWarning,
  Target,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes'

const RA = ROUTES.ANALYTICS

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
      nav(RA.SKU, Package, 'По товарам', 'Прибыль и маржа каждого SKU', 'blue'),
      nav(RA.BRAND, Tags, 'По брендам', 'Эффективность брендов', 'emerald'),
      nav(RA.CATEGORY, BarChart3, 'По категориям', 'Сравнение категорий', 'violet'),
      nav(RA.TIME_PERIOD, Calendar, 'По времени', 'Динамика по неделям', 'amber'),
      nav(
        RA.FINANCE_HISTORY,
        BarChart3,
        'Финансовая история',
        'P&L по неделям: прибыль, маржа, доли расходов',
        'cyan'
      ),
      nav(
        RA.BUYOUT_RECONCILIATION,
        FileCheck,
        'Сверка выкупов',
        'Реконсиляция выкупов и заказов',
        'sky'
      ),
    ],
  },
  operational: {
    title: 'Операционная аналитика',
    description: 'Склад, поставки и затраты',
    items: [
      nav(RA.STORAGE, Warehouse, 'Хранение', 'Затраты на хранение по SKU', 'slate'),
      nav(RA.SUPPLY_PLANNING, PackageSearch, 'Планирование', 'Прогноз стокаутов', 'rose', 'Важно'),
      nav(
        RA.ORDERS,
        ClipboardList,
        'Заказы FBS',
        'Анализ заказов FBS за 365 дней',
        'orange',
        'Новое'
      ),
      nav(RA.FBS_STOCK, Boxes, 'Остатки FBS', 'Остатки на складах FBS', 'slate'),
      nav(
        RA.FBS_ENHANCED,
        ArrowLeftRight,
        'Расширенная сверка FBS',
        'Улучшенная реконсилия FBS',
        'blue'
      ),
      nav(RA.REORDER, Truck, 'Дозаказ', 'Рекомендации по дозаказу', 'amber'),
    ],
  },
  marketing: {
    title: 'Маркетинг и SEO',
    description: 'Воронка, реклама, поиск и аналитика',
    items: [
      nav(RA.FUNNEL, Filter, 'Воронка продаж', 'Просмотры → корзина → заказы → выкупы', 'cyan'),
      nav(RA.ADVERTISING, Megaphone, 'Реклама', 'Кампании, ROAS и эффективность', 'amber'),
      nav(RA.SEARCH, Search, 'Поисковая аналитика', 'Поисковые запросы, позиции и заказы', 'sky'),
      nav(RA.BUYOUT, ShoppingBag, 'Аналитика выкупов', 'Процент выкупа и тренды по SKU', 'teal'),
      nav(RA.RETURNS, RotateCcw, 'Аналитика возвратов', 'Причины возвратов и аномалии', 'pink'),
      nav(
        RA.CROSS_REFERENCE,
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
      nav(RA.UNIT_ECONOMICS, Calculator, 'Юнит-экономика', 'Структура затрат на единицу', 'indigo'),
      nav(RA.FORECAST, Brain, 'AI Прогноз', 'Прогноз продаж на основе ML', 'purple', 'ML'),
      nav(RA.PRICING, Tag, 'Рекомендации по ценам', 'Цены для целевой маржинальности', 'emerald'),
      nav(RA.ALERTS, Bell, 'Оповещения', 'Управление оповещениями и уведомлениями', 'red'),
      nav(RA.GAPS, FileWarning, 'Пропуски данных', 'Качество и полнота данных', 'yellow'),
      nav(
        RA.FORECAST_ACCURACY,
        Target,
        'Точность прогнозов',
        'Метрики точности ML-моделей',
        'purple'
      ),
    ],
  },
}
