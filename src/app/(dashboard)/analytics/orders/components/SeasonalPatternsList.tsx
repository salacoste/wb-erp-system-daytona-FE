/**
 * Seasonal Patterns List Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Horizontal bar chart display for seasonal patterns.
 */

'use client'

import type { SeasonalPatterns, SeasonalViewType } from '@/types/fbs-analytics'

interface SeasonalPatternsListProps {
  patterns: SeasonalPatterns
  view: SeasonalViewType
}

/** Russian month names */
const MONTHS_RU: Record<string, string> = {
  January: 'Январь',
  February: 'Февраль',
  March: 'Март',
  April: 'Апрель',
  May: 'Май',
  June: 'Июнь',
  July: 'Июль',
  August: 'Август',
  September: 'Сентябрь',
  October: 'Октябрь',
  November: 'Ноябрь',
  December: 'Декабрь',
}

/** Russian day of week names */
const DAYS_RU: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
}

export function SeasonalPatternsList({ patterns, view }: SeasonalPatternsListProps) {
  const items =
    view === 'monthly'
      ? patterns.monthly
      : view === 'weekly'
        ? patterns.weekday
        : patterns.quarterly

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Нет данных для выбранного представления
      </div>
    )
  }

  const maxOrders = Math.max(...items.map(item => item.avgOrders))

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const label =
          'month' in item
            ? MONTHS_RU[item.month] || item.month
            : 'dayOfWeek' in item
              ? DAYS_RU[item.dayOfWeek] || item.dayOfWeek
              : item.quarter
        const orders = item.avgOrders
        const width = maxOrders > 0 ? (orders / maxOrders) * 100 : 0

        return (
          <div key={idx} className="flex items-center gap-4">
            <span className="w-28 text-sm text-muted-foreground truncate">{label}</span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-20 text-sm font-medium text-right">
              {Math.round(orders)} заказов
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { MONTHS_RU, DAYS_RU }
