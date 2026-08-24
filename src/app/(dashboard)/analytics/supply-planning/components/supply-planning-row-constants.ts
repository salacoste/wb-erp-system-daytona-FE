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
  HelpCircle,
  ShoppingCart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { StockoutRisk, VelocityTrend } from '@/types/supply-planning'
import { SUPPLY_RISK_TOKENS } from './supply-risk-tokens'

// Status icon mapping
export const STATUS_ICONS: Record<StockoutRisk, React.ComponentType<{ className?: string }>> = {
  out_of_stock: PackageX,
  critical: AlertTriangle,
  warning: AlertCircle,
  low: Clock,
  healthy: CheckCircle,
  unknown: HelpCircle, // Story 169.13: visible-unknown tier
}

// Velocity trend icon mapping
// 'no_data' is excluded: it's not a renderable trend (Defensive Frontend — indicate, don't fabricate).
export const TREND_ICONS: Record<
  Exclude<VelocityTrend, 'no_data'>,
  React.ComponentType<{ className?: string }>
> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

// Row background colors by status — derived from the single-source token map
// (Story 169.13): status/15 tint matched with /30 border (169.5 canon).
export const ROW_BG_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: SUPPLY_RISK_TOKENS.out_of_stock.rowBg,
  critical: SUPPLY_RISK_TOKENS.critical.rowBg,
  warning: SUPPLY_RISK_TOKENS.warning.rowBg,
  low: SUPPLY_RISK_TOKENS.low.rowBg,
  healthy: SUPPLY_RISK_TOKENS.healthy.rowBg,
  unknown: SUPPLY_RISK_TOKENS.unknown.rowBg,
}

// Row left border colors by status — non-color risk marker paired with the
// status icon + sr-only label (Story 169.13).
export const ROW_BORDER_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: SUPPLY_RISK_TOKENS.out_of_stock.rowBorder,
  critical: SUPPLY_RISK_TOKENS.critical.rowBorder,
  warning: SUPPLY_RISK_TOKENS.warning.rowBorder,
  low: SUPPLY_RISK_TOKENS.low.rowBorder,
  healthy: SUPPLY_RISK_TOKENS.healthy.rowBorder,
  unknown: SUPPLY_RISK_TOKENS.unknown.rowBorder,
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
      // Story 169.13: custom palette className dropped — destructive variant owns the color.
      return {
        variant: 'destructive',
        label: 'Заказать',
        icon: PackageX,
        className: '',
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
        // Story 169.13: orange palette override dropped — default variant token.
        className: '',
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
    case 'unknown':
      // No recommended action for an unknown risk level (Story 169.13).
      return null
  }
}
