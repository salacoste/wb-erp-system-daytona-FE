/**
 * Storage Trends Chart - Configuration & Formatters
 * Pure data/config extracted from StorageTrendsChart.tsx
 * Epic 24: Paid Storage Analytics (Frontend)
 */

// Chart color scheme - purple for storage to differentiate from other charts
// Story 24.10: Added selected color for click-to-filter highlight
export const CHART_COLORS = {
  storage: '#7C4DFF',
  selected: '#C62828', // Red-800 for selected week (matches sidebar active color)
  gradientStart: 'rgba(124, 77, 255, 0.3)',
  gradientEnd: 'rgba(124, 77, 255, 0)',
}

// Format currency for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

// Format week label: "2025-W44" -> "W44"
export const formatWeekShort = (week: string): string => {
  return week.split('-')[1] || week
}
