/**
 * Unit tests for orders-analytics-utils (Story 40.6-FE) — regression coverage added iter-136.
 *
 * Pure SLA/velocity threshold colors+labels, Russian duration formatting, countdown colors, and
 * Russian order-plural forms (no imports/IO). Boundary cases at every threshold.
 */

import { describe, it, expect } from 'vitest'
import {
  getSlaStatusColor,
  getSlaStatusBgColor,
  getSlaStatusLabel,
  getConfirmationTimeColor,
  getCompletionTimeColor,
  getVelocityStatusColor,
  getVelocityStatusLabel,
  formatDuration,
  formatDurationShort,
  getCountdownColor,
  getOrdersPlural,
} from '@/lib/orders-analytics-utils'

describe('SLA status (95 / 85 thresholds)', () => {
  it('color: >=95 green, [85,95) yellow, <85 red', () => {
    expect(getSlaStatusColor(95)).toBe('text-status-success')
    expect(getSlaStatusColor(94.9)).toBe('text-status-warning')
    expect(getSlaStatusColor(85)).toBe('text-status-warning')
    expect(getSlaStatusColor(84.9)).toBe('text-status-error')
  })
  it('bg color tracks the same thresholds', () => {
    expect(getSlaStatusBgColor(95)).toBe('bg-status-success/10')
    expect(getSlaStatusBgColor(90)).toBe('bg-status-warning/10')
    expect(getSlaStatusBgColor(80)).toBe('bg-status-error/10')
  })
  it('label: Отлично / Внимание / Критично', () => {
    expect(getSlaStatusLabel(95)).toBe('Отлично')
    expect(getSlaStatusLabel(90)).toBe('Внимание')
    expect(getSlaStatusLabel(80)).toBe('Критично')
  })
})

describe('velocity colors + labels', () => {
  it('confirmation: <30 green, [30,60) yellow, >=60 red', () => {
    expect(getConfirmationTimeColor(29)).toBe('text-status-success')
    expect(getConfirmationTimeColor(30)).toBe('text-status-warning')
    expect(getConfirmationTimeColor(59)).toBe('text-status-warning')
    expect(getConfirmationTimeColor(60)).toBe('text-status-error')
  })
  it('completion: <180 green, [180,360) yellow, >=360 red', () => {
    expect(getCompletionTimeColor(179)).toBe('text-status-success')
    expect(getCompletionTimeColor(180)).toBe('text-status-warning')
    expect(getCompletionTimeColor(360)).toBe('text-status-error')
  })
  it('getVelocityStatusColor delegates by type (30 min: confirm=yellow, complete=green)', () => {
    expect(getVelocityStatusColor(30, 'confirm')).toBe('text-status-warning')
    expect(getVelocityStatusColor(30, 'complete')).toBe('text-status-success')
  })
  it('getVelocityStatusLabel uses per-type thresholds', () => {
    expect(getVelocityStatusLabel(29, 'confirm')).toBe('Быстро')
    expect(getVelocityStatusLabel(45, 'confirm')).toBe('Приемлемо')
    expect(getVelocityStatusLabel(60, 'confirm')).toBe('Медленно')
    expect(getVelocityStatusLabel(100, 'complete')).toBe('Быстро') // 100 < 180
    expect(getVelocityStatusLabel(360, 'complete')).toBe('Медленно')
  })
})

describe('formatDuration', () => {
  it('renders minutes / hours / hours+minutes / days+hours', () => {
    expect(formatDuration(35)).toBe('35 мин')
    expect(formatDuration(59)).toBe('59 мин')
    expect(formatDuration(60)).toBe('1 ч') // exact hour, no minutes
    expect(formatDuration(135)).toBe('2 ч 15 мин')
    expect(formatDuration(1720)).toBe('1 д 4 ч') // doc example: 28h40m → 1 day 4 hours
  })
})

describe('formatDurationShort', () => {
  it('drops the minutes component', () => {
    expect(formatDurationShort(35)).toBe('35 мин')
    expect(formatDurationShort(90)).toBe('1 ч')
    expect(formatDurationShort(120)).toBe('2 ч')
    expect(formatDurationShort(1440)).toBe('1 д')
  })
})

describe('getCountdownColor', () => {
  it('error breached / warning <10 / warning <30 / muted >=30', () => {
    expect(getCountdownColor(-5)).toBe('text-status-error')
    expect(getCountdownColor(5)).toBe('text-status-warning')
    expect(getCountdownColor(20)).toBe('text-status-warning')
    expect(getCountdownColor(30)).toBe('text-muted-foreground')
  })
})

describe('getOrdersPlural (Russian)', () => {
  it('selects заказ / заказа / заказов by Russian plural rules', () => {
    expect(getOrdersPlural(1)).toBe('1 заказ')
    expect(getOrdersPlural(2)).toBe('2 заказа')
    expect(getOrdersPlural(5)).toBe('5 заказов')
    expect(getOrdersPlural(0)).toBe('0 заказов')
  })
  it('handles the 11-19 teens exception', () => {
    expect(getOrdersPlural(11)).toBe('11 заказов')
    expect(getOrdersPlural(14)).toBe('14 заказов')
    expect(getOrdersPlural(111)).toBe('111 заказов')
  })
  it('handles compound numbers by last digit', () => {
    expect(getOrdersPlural(21)).toBe('21 заказ')
    expect(getOrdersPlural(22)).toBe('22 заказа')
    expect(getOrdersPlural(25)).toBe('25 заказов')
  })
})
