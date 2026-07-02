/**
 * Monitor Metrics Config — row definitions & directions
 * Extracted from monitor-metrics-utils.ts (200-line ESLint cap, batch 2)
 *
 * Contains: ROW_DIRECTIONS, RowDef type, buildRows.
 * Pure data + one builder function; no React or hooks.
 */

import type { MonitorSummaryResponse } from '../types/monitor-summary'
import type { Direction } from './monitor-metrics-utils'

export interface RowDef {
  key: string
  label: string
  /** Optional clarifying text rendered below the main label (BD-22/23/24 mislabel fixes). */
  subtitle?: string
  direction: Direction
  values: {
    today: number | null
    yesterday: number | null
    last30: number | null
    prev30: number | null
  }
  isMoney: boolean
}

/** Single source of truth for which metrics are higher-is-better vs higher-is-worse (fix L-2). */
export const ROW_DIRECTIONS = {
  orders: 'higher-is-better',
  sales: 'higher-is-better',
  revenue: 'higher-is-better',
  cogs: 'higher-is-worse',
  expenses: 'higher-is-worse',
  margin: 'higher-is-better',
  returns: 'higher-is-worse',
} as const satisfies Record<string, Direction>

/** Builds the 7 static row definitions from the 4-period data. */
export function buildRows(periods: MonitorSummaryResponse['periods']): RowDef[] {
  const { today, yesterday, last30Days, prev30Days } = periods
  return [
    {
      key: 'orders',
      // BD-22: renamed from "Заказы" — value is salesCount+returnsCount, NOT a real order count.
      // Monitor endpoint exposes no real order count; this is a transaction sum shown for reference.
      label: 'Продажи + Возвраты (транзакций)',
      subtitle: 'Сумма транзакций, не количество заказов',
      direction: ROW_DIRECTIONS.orders,
      values: {
        today: today.salesCount + today.returnsCount,
        yesterday: yesterday.salesCount + yesterday.returnsCount,
        last30: last30Days.salesCount + last30Days.returnsCount,
        prev30: prev30Days.salesCount + prev30Days.returnsCount,
      },
      isMoney: false,
    },
    {
      key: 'sales',
      label: 'Продажи',
      direction: ROW_DIRECTIONS.sales,
      values: {
        today: today.salesCount,
        yesterday: yesterday.salesCount,
        last30: last30Days.salesCount,
        prev30: prev30Days.salesCount,
      },
      isMoney: false,
    },
    {
      key: 'revenue',
      label: 'Выручка',
      direction: ROW_DIRECTIONS.revenue,
      values: {
        today: today.revenue,
        yesterday: yesterday.revenue,
        last30: last30Days.revenue,
        prev30: prev30Days.revenue,
      },
      isMoney: true,
    },
    {
      key: 'cogs',
      // BD-24: renamed from "Продажи по себестоимости" — value IS the cost (COGS), not revenue.
      label: 'Себестоимость (COGS)',
      subtitle: 'Затраты на проданные товары',
      direction: ROW_DIRECTIONS.cogs,
      values: {
        today: today.cogs,
        yesterday: yesterday.cogs,
        last30: last30Days.cogs,
        prev30: prev30Days.cogs,
      },
      isMoney: true,
    },
    {
      key: 'expenses',
      label: 'Расходы',
      direction: ROW_DIRECTIONS.expenses,
      values: {
        today: today.expenses,
        yesterday: yesterday.expenses,
        last30: last30Days.expenses,
        prev30: prev30Days.expenses,
      },
      isMoney: true,
    },
    {
      key: 'margin',
      label: 'Маржа',
      direction: ROW_DIRECTIONS.margin,
      values: {
        today: today.margin,
        yesterday: yesterday.margin,
        last30: last30Days.margin,
        prev30: prev30Days.margin,
      },
      isMoney: true,
    },
    {
      key: 'returns',
      label: 'Возвраты',
      direction: ROW_DIRECTIONS.returns,
      values: {
        today: today.returnsCount,
        yesterday: yesterday.returnsCount,
        last30: last30Days.returnsCount,
        prev30: prev30Days.returnsCount,
      },
      isMoney: false,
    },
  ]
}
