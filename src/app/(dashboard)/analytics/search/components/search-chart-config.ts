/**
 * Search route chart token config — SINGLE SOURCE (Story 170.7 Task 2).
 *
 * Pre-migration the exact same color triple (line #3B82F6, grid #EEEEEE,
 * tick #757575) was duplicated across two chart configs: the consts in
 * position-history-helpers.tsx and the inline recharts props in
 * SearchOrdersChart.tsx. Story 170.7 unified them here (169.4 chart-token
 * canon): line → chart-1, grid → border, tick → chart-axis.
 *
 * position-history-helpers.tsx re-exports these as LINE_COLOR / GRID_STROKE /
 * TICK_FILL for its existing consumers; SearchOrdersChart imports directly.
 */

export const SEARCH_CHART_TOKENS = {
  line: 'var(--color-chart-1)',
  grid: 'var(--color-border)',
  tick: 'var(--color-chart-axis)',
} as const
