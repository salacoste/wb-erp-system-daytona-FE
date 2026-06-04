/**
 * Unit tests for fbs-analytics-formatters (Story 51.1-FE) — regression coverage added iter-142.
 *
 * Pure chart config + date/number formatters. Date functions use new Date(str) which is TZ-sensitive
 * for date-only ISO; ISO cases use a NOON local-time input so getDate() never crosses a day boundary
 * (robust across any CI timezone). Percent uses \s-regex for the NBSP (raw-string return).
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_METRIC_VISIBILITY,
  CHART_LINE_COLORS,
  METRIC_LABELS,
  getMetricLabel,
  formatChartDate,
  formatTooltipDate,
  formatPercentValue,
} from '@/lib/fbs-analytics-formatters'

describe('chart config constants', () => {
  it('DEFAULT_METRIC_VISIBILITY shows orders+revenue, hides cancellations', () => {
    expect(DEFAULT_METRIC_VISIBILITY).toEqual({
      orders: true,
      revenue: true,
      cancellations: false,
    })
  })
  it('CHART_LINE_COLORS maps each metric to a hex color', () => {
    expect(CHART_LINE_COLORS.orders).toBe('#3B82F6')
    expect(CHART_LINE_COLORS.revenue).toBe('#22C55E')
    expect(CHART_LINE_COLORS.cancellations).toBe('#EF4444')
  })
})

describe('getMetricLabel', () => {
  it('returns the Russian label for each metric', () => {
    expect(getMetricLabel('orders')).toBe('Заказы')
    expect(getMetricLabel('revenue')).toBe('Выручка')
    expect(getMetricLabel('cancellations')).toBe('Отмены')
    expect(getMetricLabel('orders')).toBe(METRIC_LABELS.orders)
  })
})

describe('formatChartDate (DD.MM / Www)', () => {
  it('strips the year from a week string', () => {
    expect(formatChartDate('2026-W03')).toBe('W03')
  })
  it('formats an ISO date as DD.MM (noon input → TZ-robust)', () => {
    expect(formatChartDate('2026-03-05T12:00:00')).toBe('05.03')
  })
  it('returns the input unchanged when unparseable', () => {
    expect(formatChartDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatTooltipDate (DD.MM.YYYY / Неделя)', () => {
  it('renders a week string as "Неделя WW, YYYY"', () => {
    expect(formatTooltipDate('2026-W03')).toBe('Неделя 03, 2026')
  })
  it('formats an ISO date as DD.MM.YYYY (noon input → TZ-robust)', () => {
    expect(formatTooltipDate('2026-03-05T12:00:00')).toBe('05.03.2026')
  })
  it('returns the input unchanged when unparseable', () => {
    expect(formatTooltipDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatPercentValue (comma + NBSP)', () => {
  it('renders 2-decimal percents with comma + NBSP', () => {
    expect(formatPercentValue(6.67)).toMatch(/^6,67\s%$/)
  })
  it('renders whole percents without trailing zeros', () => {
    expect(formatPercentValue(5)).toMatch(/^5\s%$/)
    expect(formatPercentValue(0)).toMatch(/^0\s%$/)
  })
})
