/**
 * Sidebar navigation items configuration
 * Extracted from Sidebar.tsx to comply with 200-line file limit
 * Story 3.1: Main Dashboard Layout & Navigation
 */

import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Package,
  BarChart3,
  Settings,
  Warehouse,
  LayoutDashboard,
  PackageSearch,
  Calculator,
  DollarSign,
  Droplets,
  Megaphone,
  Bell,
  Settings2,
  ShoppingCart,
  ClipboardList,
  Activity,
  Filter,
  RotateCcw,
  ShoppingBag,
  Receipt,
  Store,
  Search,
  ArrowRightLeft,
  Truck,
  CreditCard,
  Gauge,
  Boxes,
  BarChart2,
  GitCompare,
  Brain,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  adminOnly?: boolean
}

/**
 * Static navigation items (no runtime dependencies).
 * Items with `adminOnly: true` are filtered at render time.
 * Items needing dynamic badges (e.g. supply planning) are
 * patched in the Sidebar component.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  // Epic 40-FE: Orders UI (WB Native Orders History)
  { label: 'Заказы', href: ROUTES.ORDERS.ROOT, icon: ShoppingCart },
  { label: 'COGS Management', href: ROUTES.COGS.ROOT, icon: Package },
  // Epic 44: Price Calculator UI
  { label: 'Price Calculator', href: '/cogs/price-calculator', icon: DollarSign },
  // Story 6.4-FE: Cabinet Summary Dashboard
  { label: 'Cabinet Summary', href: ROUTES.ANALYTICS.DASHBOARD, icon: LayoutDashboard },
  { label: 'Analytics', href: ROUTES.ANALYTICS.ROOT, icon: BarChart3 },
  // Epic 24: Paid Storage Analytics
  { label: 'Storage', href: ROUTES.ANALYTICS.STORAGE, icon: Warehouse },
  // Epic 6: Supply Planning & Stockout Prevention
  { label: 'Планирование', href: ROUTES.ANALYTICS.SUPPLY_PLANNING, icon: PackageSearch },
  // Epic 5: Unit Economics Analytics
  { label: 'Юнит-экономика', href: ROUTES.ANALYTICS.UNIT_ECONOMICS, icon: Calculator },
  // Epic 7: Liquidity Analysis
  { label: 'Ликвидность', href: ROUTES.ANALYTICS.LIQUIDITY, icon: Droplets },
  // Epic 33: Advertising Analytics
  { label: 'Реклама', href: ROUTES.ANALYTICS.ADVERTISING, icon: Megaphone },
  // Epic 51-FE: FBS Historical Analytics
  { label: 'Заказы FBS', href: ROUTES.ANALYTICS.ORDERS, icon: ClipboardList },
  // Epic 96-FE Story 96.11: FBS Stock Breakdowns (adjacent to "Заказы FBS" — L-2 fix)
  // Boxes icon (M2-4): distinguishes from "Storage" which uses Warehouse.
  { label: 'Остатки FBS', href: ROUTES.ANALYTICS.FBS_STOCK, icon: Boxes },
  // Epic 96-FE Story 96.13: FBS Enhanced Analytics aggregated view (orderStats + funnel)
  // BarChart2 icon: visually distinct from Boxes (FBS Stock) and Warehouse (Storage).
  { label: 'Расширенная аналитика FBS', href: ROUTES.ANALYTICS.FBS_ENHANCED, icon: BarChart2 },
  // Epic 68: Marketing Funnel Analytics
  { label: 'Воронка продаж', href: ROUTES.ANALYTICS.FUNNEL, icon: Filter },
  // Epic 69: Buyout Rate Analytics
  { label: 'Аналитика выкупов', href: ROUTES.ANALYTICS.BUYOUT, icon: ShoppingBag },
  // Epic 96-FE Story 96.14: Buyout Reconciliation (anomaly audit — distinct from rate analytics)
  // GitCompare icon: conveys data reconciliation / source comparison semantic.
  { label: 'Сверка выкупов', href: ROUTES.ANALYTICS.BUYOUT_RECONCILIATION, icon: GitCompare },
  // Epic 70-FE: Returns Analytics
  { label: 'Аналитика возвратов', href: ROUTES.ANALYTICS.RETURNS, icon: RotateCcw },
  // Epic 90-FE: Acquiring Cost Reports
  { label: 'Эквайринг', href: ROUTES.ANALYTICS.ACQUIRING, icon: CreditCard },
  // Epic 71-FE: Search Analytics
  { label: 'Поиск', href: ROUTES.ANALYTICS.SEARCH, icon: Search },
  // Story 73.7-FE: Search + Advertising Cross-Reference
  { label: 'Кросс-анализ', href: ROUTES.ANALYTICS.CROSS_REFERENCE, icon: ArrowRightLeft },
  // Epic 103-FE: AI Sales Forecast
  { label: 'AI Прогноз', href: ROUTES.ANALYTICS.FORECAST, icon: Brain },
  // Epic 75-FE: Shipment Cost Allocation
  { label: 'Доставка', href: ROUTES.SHIPMENTS.ROOT, icon: Truck },
  // Epic 68-FE: Monitoring Health Dashboard
  { label: 'Мониторинг', href: ROUTES.MONITORING, icon: Activity },
  // Epic 92-FE: Monitor Dashboard (business KPI surface)
  { label: 'Монитор', href: ROUTES.MONITOR, icon: Gauge },
  // Epic 34-FE: Telegram Notifications
  { label: 'Уведомления', href: ROUTES.SETTINGS.NOTIFICATIONS, icon: Bell },
  // Epic 52-FE: Tariff Settings Admin (Admin only)
  { label: 'Тарифы', href: ROUTES.SETTINGS.TARIFFS, icon: Settings2, adminOnly: true },
  // Seller info + Jam subscription
  { label: 'Кабинет', href: ROUTES.SETTINGS.CABINET, icon: Store },
  // Epic 66-FE: Tax & VAT Settings
  { label: 'Налоги', href: ROUTES.SETTINGS.TAX, icon: Receipt },
  { label: 'Settings', href: ROUTES.SETTINGS.ROOT, icon: Settings },
]
