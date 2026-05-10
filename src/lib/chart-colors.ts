/**
 * Design System chart color tokens — Story 96.13-FE L-2.
 * Centralized to prevent inline-color drift across recharts/SVG charts.
 * Aligned with CLAUDE.md Design System (Primary Red #E53935, etc.).
 *
 * Usage: import { CHART_COLORS } from '@/lib/chart-colors'
 *
 * Scope: introduced in Story 96.13-FE for FbsRegionalDataSection + FbsFunnelSection.
 * Do NOT refactor existing chart files retroactively — add here as new files are created.
 */

export const CHART_COLORS = {
  /** Primary brand red — CLAUDE.md Design System Primary Red */
  primaryRed: '#E53935',
  /** Primary blue — metric/information color */
  primaryBlue: '#3B82F6',
  /** Amber — warnings, medium severity */
  amber: '#F59E0B',
  /** Green — positive values, profitable margins */
  green: '#22C55E',
} as const
