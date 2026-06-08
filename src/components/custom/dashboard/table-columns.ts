/**
 * Table Column Definitions
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Column configuration and formatting for daily metrics table.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { formatCurrency } from '@/lib/utils'
import type { DailyMetrics } from '@/types/daily-metrics'

export { calculateTotals } from './table-totals'

/** Russian day names by ISO day number (1=Monday) */
const DAY_NAMES: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
}

/**
 * Format date as "Пн 27.01" pattern.
 */
export function formatDayWithDate(date: string, dayOfWeek: number): string {
  const dayName = DAY_NAMES[dayOfWeek] || '?'
  const dateObj = new Date(date)
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  return `${dayName} ${day}.${month}`
}

/** Column definition type */
export interface ColumnDef {
  /** Column key matching DailyMetrics property */
  key: string
  /** Column header label (Russian) */
  label: string
  /** Fixed column width */
  width: string
  /** Text alignment */
  align: 'left' | 'right'
  /** Enable sorting for this column */
  sortable: boolean
  /** Expense column — positive cost displayed in gray text (no sign prefix) */
  isExpense?: boolean
  /** Colorize based on value sign (green positive, red negative) */
  colorize?: boolean
  /** Optional tooltip text on column header */
  tooltip?: string
}

/** Table column definitions — full daily P&L view */
export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Дата', width: '100px', align: 'left', sortable: true },
  {
    key: 'ordersCount',
    label: 'Заказы, шт',
    width: '110px',
    align: 'right',
    sortable: true,
    tooltip: 'Только заказы FBS (по дням). Общее кол-во FBO+FBS см. в карточке «Заказы».',
  },
  { key: 'orders', label: 'Сумма заказов', width: '130px', align: 'right', sortable: true },
  { key: 'sales', label: 'Выкупы', width: '120px', align: 'right', sortable: true },
  {
    key: 'advertising',
    label: 'Реклама',
    width: '110px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'logistics',
    label: 'Логистика',
    width: '110px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'storage',
    label: 'Хранение',
    width: '100px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'commission',
    label: 'Комиссия',
    width: '110px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'theoreticalProfit',
    label: 'Теор.прибыль',
    width: '130px',
    align: 'right',
    sortable: true,
    colorize: true,
  },
]

/**
 * Format cell value based on column configuration.
 */
export function formatCellValue(row: DailyMetrics, column: ColumnDef): string {
  if (column.key === 'date') {
    // Totals row uses literal 'Итого' with dayOfWeek=0 — return as-is to avoid "NaN" from invalid Date
    if (row.dayOfWeek === 0) return row.date
    return formatDayWithDate(row.date, row.dayOfWeek)
  }

  const value = row[column.key as keyof DailyMetrics]
  // Story 88.2-FE: null ("unknown") renders as em dash, distinct from "-"/"0"
  if (value === null) return '—'
  if (typeof value !== 'number') return '-'

  // ordersCount is integer — format without currency symbol
  if (column.key === 'ordersCount') {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value))
  }

  // Math.abs as safety net — costs should be positive from backend
  return formatCurrency(Math.abs(value))
}

/**
 * Get comparator function for sorting by column.
 */
export function getColumnComparator(key: string): (a: DailyMetrics, b: DailyMetrics) => number {
  if (key === 'date') {
    return (a, b) => a.date.localeCompare(b.date)
  }
  return (a, b) => {
    // Story 106.1-FE: cast to number|null to handle theoreticalProfit (and ordersCogs/salesCogs).
    // Null values sort as 0 (bottom in ascending order) — avoids NaN from null arithmetic.
    const aVal = (a[key as keyof DailyMetrics] as number | null) ?? 0
    const bVal = (b[key as keyof DailyMetrics] as number | null) ?? 0
    return aVal - bVal
  }
}
