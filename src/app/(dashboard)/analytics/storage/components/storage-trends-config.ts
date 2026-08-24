/**
 * Storage Trends Chart - Configuration
 * Pure data/config extracted from StorageTrendsChart.tsx
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Story 169.12: legacy local hex palette (#7C4DFF storage / #C62828 selected,
 * plus never-consumed rgba gradient stops — deleted) → registered chart var()
 * tokens, single source of truth for stroke/fill/dot (169.10/169.11 chart-token
 * canon). Selected-week emphasis is negative-valence → chart-negative
 * (169.4 BuyoutTrend dot-emphasis precedent).
 *
 * Formatters moved to storage-format.ts (route dedupe, Story 169.12).
 */

export const CHART_COLORS = {
  storage: 'var(--color-chart-1)',
  selected: 'var(--color-chart-negative)',
} as const
