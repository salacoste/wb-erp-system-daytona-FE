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
  /** Show negative prefix for expense columns */
  negativePrefix?: boolean
  /** Colorize based on value sign (profit column) */
  colorize?: boolean
}

/** Table column definitions — simplified P&L view (4 columns) */
export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Дата', width: '100px', align: 'left', sortable: true },
  { key: 'ordersCount', label: 'Заказы, шт', width: '110px', align: 'right', sortable: true },
  { key: 'orders', label: 'Сумма заказов', width: '140px', align: 'right', sortable: true },
  {
    key: 'advertising',
    label: 'Реклама',
    width: '120px',
    align: 'right',
    sortable: true,
    negativePrefix: true,
  },
]

/**
 * Format cell value based on column configuration.
 */
export function formatCellValue(row: DailyMetrics, column: ColumnDef): string {
  if (column.key === 'date') {
    return formatDayWithDate(row.date, row.dayOfWeek)
  }

  const value = row[column.key as keyof DailyMetrics] as number
  if (typeof value !== 'number') return '-'

  // ordersCount is integer — format without currency symbol
  if (column.key === 'ordersCount') {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value))
  }

  const formatted = formatCurrency(Math.abs(value))

  if (column.negativePrefix && value !== 0) {
    return `-${formatted}`
  }

  return formatted
}

/**
 * Get comparator function for sorting by column.
 */
export function getColumnComparator(key: string): (a: DailyMetrics, b: DailyMetrics) => number {
  if (key === 'date') {
    return (a, b) => a.date.localeCompare(b.date)
  }
  return (a, b) => {
    const aVal = a[key as keyof DailyMetrics] as number
    const bVal = b[key as keyof DailyMetrics] as number
    return aVal - bVal
  }
}

/**
 * Calculate totals row from daily data.
 */
export function calculateTotals(data: DailyMetrics[]): DailyMetrics {
  const initial: DailyMetrics = {
    date: 'Итого',
    dayOfWeek: 0,
    orders: 0,
    ordersCount: 0,
    ordersCogs: 0,
    sales: 0,
    salesCogs: 0,
    advertising: 0,
    logistics: 0,
    storage: 0,
    theoreticalProfit: 0,
  }

  return data.reduce(
    (acc, day) => ({
      ...acc,
      orders: acc.orders + day.orders,
      ordersCount: acc.ordersCount + day.ordersCount,
      ordersCogs: acc.ordersCogs + day.ordersCogs,
      sales: acc.sales + day.sales,
      salesCogs: acc.salesCogs + day.salesCogs,
      advertising: acc.advertising + day.advertising,
      logistics: acc.logistics + day.logistics,
      storage: acc.storage + day.storage,
      theoreticalProfit: acc.theoreticalProfit + day.theoreticalProfit,
    }),
    initial
  )
}
