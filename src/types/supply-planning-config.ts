/**
 * Supply Planning UI Configuration Types
 * Extracted from supply-planning.ts for 200-line cap compliance.
 * Epic 6 - Supply Planning & Stockout Prevention
 */

import type { StockoutRisk } from './supply-planning'

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Risk status display configuration
 * Updated per UX Expert specs (Sally, 2025-12-12)
 */
export interface RiskStatusConfig {
  /** Full label (e.g., "Нет в наличии") */
  label: string
  /** Short label for compact views (e.g., "Нет") */
  labelShort: string
  /** Primary color hex (e.g., "#1F2937") */
  color: string
  /** Background color for light badges (e.g., "#F3F4F6") */
  bgColor: string
  /** Emoji icon for quick visual (e.g., "⬛") */
  icon: string
  /** Lucide icon component name (e.g., "PackageX") */
  lucideIcon: string
  /** Tailwind bg class for solid badges (e.g., "bg-gray-800") */
  bgClass: string
  /** Tailwind text class for solid badges (e.g., "text-white") */
  textClass: string
  /** Sort priority (0 = most urgent) */
  priority: number
}

/**
 * Reorder status display configuration
 */
export interface ReorderStatusConfig {
  label: string
  color: string
  bgColor: string
}

/**
 * Distribution chart data point
 */
export interface RiskDistributionData {
  status: StockoutRisk
  count: number
  label: string
  color: string
}
