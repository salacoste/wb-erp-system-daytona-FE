/**
 * Supply Planning Row Constants & Helpers
 * Extracted from SupplyPlanningRow.tsx (Epic 74 - file size compliance)
 *
 * Pure config — no 'use client' needed.
 */

import {
  PackageX,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { StockoutRisk, VelocityTrend } from '@/types/supply-planning'

// Status icon mapping
export const STATUS_ICONS: Record<StockoutRisk, React.ComponentType<{ className?: string }>> = {
  out_of_stock: PackageX,
  critical: AlertTriangle,
  warning: AlertCircle,
  low: Clock,
  healthy: CheckCircle,
}

// Velocity trend icon mapping
export const TREND_ICONS: Record<VelocityTrend, React.ComponentType<{ className?: string }>> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

// Row background colors by status (UX spec)
export const ROW_BG_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: 'bg-gray-100',
  critical: 'bg-red-50',
  warning: 'bg-orange-50',
  low: 'bg-yellow-50',
  healthy: 'bg-white',
}

// Row left border colors by status (UX spec)
export const ROW_BORDER_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: 'border-l-4 border-gray-800',
  critical: 'border-l-4 border-red-500',
  warning: 'border-l-4 border-orange-500',
  low: 'border-l-4 border-yellow-500',
  healthy: '',
}

// Action button configuration per stockout risk level
interface ActionButtonConfig {
  variant: 'destructive' | 'default' | 'outline'
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}

export function getActionButton(stockoutRisk: StockoutRisk): ActionButtonConfig | null {
  switch (stockoutRisk) {
    case 'out_of_stock':
      return {
        variant: 'destructive',
        label: 'Заказать',
        icon: PackageX,
        className: 'bg-gray-800 hover:bg-gray-900',
      }
    case 'critical':
      return {
        variant: 'destructive',
        label: 'Срочно',
        icon: AlertTriangle,
        className: '',
      }
    case 'warning':
      return {
        variant: 'default',
        label: 'Заказать',
        icon: ShoppingCart,
        className: 'bg-orange-500 hover:bg-orange-600',
      }
    case 'low':
      return {
        variant: 'outline',
        label: 'План',
        icon: Calendar,
        className: '',
      }
    case 'healthy':
      return null
  }
}
