import { PackageX, AlertTriangle, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import type { StockoutRisk } from '@/types/supply-planning'

/**
 * Supply Risk Card Styles & Icon Mappings
 * Extracted from SupplyRiskCards.tsx for file size compliance.
 */

// Lucide icon mapping
export const LUCIDE_ICONS = {
  PackageX,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
} as const

export interface CardStyleSet {
  card: string
  icon: string
  label: string
  count: string
}

/**
 * Get Tailwind classes for card styling based on status
 * UX Specs: Different background colors per status
 */
export function getCardStyles(status: StockoutRisk, isActive: boolean): CardStyleSet {
  const styles: Record<StockoutRisk, CardStyleSet> = {
    out_of_stock: {
      card: isActive ? 'bg-gray-800 border-gray-900' : 'bg-gray-100 border-gray-200',
      icon: isActive ? 'text-white' : 'text-gray-700',
      label: isActive ? 'text-white' : 'text-gray-700',
      count: isActive ? 'text-white' : 'text-gray-900',
    },
    critical: {
      card: isActive ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      label: 'text-red-700',
      count: 'text-red-900',
    },
    warning: {
      card: isActive ? 'bg-orange-100 border-orange-300' : 'bg-orange-50 border-orange-200',
      icon: 'text-orange-600',
      label: 'text-orange-700',
      count: 'text-orange-900',
    },
    low: {
      card: isActive ? 'bg-yellow-100 border-yellow-300' : 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      label: 'text-yellow-700',
      count: 'text-yellow-900',
    },
    healthy: {
      card: isActive ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      label: 'text-green-700',
      count: 'text-green-900',
    },
  }

  return styles[status]
}
