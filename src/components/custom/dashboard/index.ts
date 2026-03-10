/**
 * Dashboard Components - Barrel Export
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Re-exports from sub-barrels for file-size compliance (Epic 74).
 * External consumers import from '@/components/custom/dashboard' — unchanged.
 *
 * @see docs/epics/epic-62-fe-dashboard-presentation.md
 */

// Metric cards, skeletons, daily breakdown, P&L cards, grid
export * from './index-metrics'

// Charts, widgets, analytics sections, trends, seasonal, comparison
export * from './index-widgets'
