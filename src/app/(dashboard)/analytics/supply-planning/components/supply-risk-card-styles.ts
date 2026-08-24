import { PackageX, AlertTriangle, AlertCircle, Clock, CheckCircle, HelpCircle } from 'lucide-react'
import type { StockoutRisk } from '@/types/supply-planning'
import { SUPPLY_RISK_TOKENS } from './supply-risk-tokens'

/**
 * Supply Risk Card Styles & Icon Mappings
 * Extracted from SupplyRiskCards.tsx for file size compliance.
 *
 * Story 169.13: card surfaces derive from the route-local single-source
 * token map (supply-risk-tokens.ts) — lib hex channels no longer consumed.
 */

// Lucide icon mapping
export const LUCIDE_ICONS = {
  PackageX,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
} as const

export interface CardStyleSet {
  card: string
  icon: string
  label: string
  count: string
}

/**
 * Get Tailwind classes for card styling based on status
 * UX Specs: Different background colors per status (now semantic tokens)
 */
export function getCardStyles(status: StockoutRisk, isActive: boolean): CardStyleSet {
  const tokens = SUPPLY_RISK_TOKENS[status]
  return {
    card: isActive ? tokens.cardActive : tokens.card,
    icon: tokens.icon,
    label: tokens.accentText,
    count: 'text-foreground',
  }
}
