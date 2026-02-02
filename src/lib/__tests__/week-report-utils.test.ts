/**
 * Week Report Utils Tests
 * Dashboard Data Availability Indicators
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getWeeklyReportExpectedDate,
  formatExpectedReportDate,
  isPeriodIncomplete,
  getMetricAvailability,
  isMetricPendingWeeklyReport,
  getAvailabilityDisplayInfo,
  METRIC_AVAILABILITY,
} from '../week-report-utils'

describe('week-report-utils', () => {
  describe('getWeeklyReportExpectedDate', () => {
    it('returns Tuesday after week ends for 2026-W05', () => {
      const result = getWeeklyReportExpectedDate('2026-W05')

      // Week 2026-W05 ends on Sunday Feb 1, 2026
      // Next Tuesday is Feb 3, 2026
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(1) // February (0-indexed)
      expect(result.getDate()).toBe(3) // Tuesday Feb 3
      expect(result.getDay()).toBe(2) // Tuesday = 2
    })

    it('returns Tuesday after week ends for 2026-W01', () => {
      const result = getWeeklyReportExpectedDate('2026-W01')

      // Week 2026-W01 ends on Sunday Jan 4, 2026
      // Next Tuesday is Jan 6, 2026
      expect(result.getDay()).toBe(2) // Tuesday
    })
  })

  describe('formatExpectedReportDate', () => {
    it('formats date in Russian locale', () => {
      const result = formatExpectedReportDate('2026-W05')

      // Should be "3 февраля" or similar Russian format
      expect(result).toMatch(/\d+ [а-я]+/)
    })
  })

  describe('isPeriodIncomplete', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Set current date to Thursday of week 2026-W05 (Jan 30, 2026)
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for current week', () => {
      expect(isPeriodIncomplete('2026-W05', 'week')).toBe(true)
    })

    it('returns false for past week', () => {
      expect(isPeriodIncomplete('2026-W04', 'week')).toBe(false)
    })

    it('returns true for current month', () => {
      expect(isPeriodIncomplete('2026-01', 'month')).toBe(true)
    })

    it('returns false for past month', () => {
      expect(isPeriodIncomplete('2025-12', 'month')).toBe(false)
    })
  })

  describe('getMetricAvailability', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns realtime for orders in current week', () => {
      expect(getMetricAvailability('ordersCount', '2026-W05', 'week')).toBe('realtime')
    })

    it('returns delayed for daily sales in current week', () => {
      expect(getMetricAvailability('dailySales', '2026-W05', 'week')).toBe('delayed')
    })

    it('returns pending_week for salesGross in current week', () => {
      expect(getMetricAvailability('salesGross', '2026-W05', 'week')).toBe('pending_week')
    })

    it('returns pending_week for logistics in current week', () => {
      expect(getMetricAvailability('logisticsTotal', '2026-W05', 'week')).toBe('pending_week')
    })

    it('returns pending_week for theoretical profit in current week', () => {
      expect(getMetricAvailability('theoreticalProfit', '2026-W05', 'week')).toBe('pending_week')
    })

    it('returns realtime for completed weeks (all data available)', () => {
      expect(getMetricAvailability('salesGross', '2026-W04', 'week')).toBe('realtime')
      expect(getMetricAvailability('logisticsTotal', '2026-W04', 'week')).toBe('realtime')
    })

    it('returns unavailable for unknown metrics', () => {
      expect(getMetricAvailability('unknownMetric', '2026-W05', 'week')).toBe('unavailable')
    })
  })

  describe('isMetricPendingWeeklyReport', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for salesGross in current week', () => {
      expect(isMetricPendingWeeklyReport('salesGross', '2026-W05', 'week')).toBe(true)
    })

    it('returns false for orders in current week', () => {
      expect(isMetricPendingWeeklyReport('ordersCount', '2026-W05', 'week')).toBe(false)
    })

    it('returns false for completed weeks', () => {
      expect(isMetricPendingWeeklyReport('salesGross', '2026-W04', 'week')).toBe(false)
    })
  })

  describe('getAvailabilityDisplayInfo', () => {
    it('returns correct info for realtime', () => {
      const info = getAvailabilityDisplayInfo('realtime')

      expect(info.label).toBe('В реальном времени')
      expect(info.color).toBe('green')
      expect(info.description).toContain('5-60 минут')
    })

    it('returns correct info for delayed', () => {
      const info = getAvailabilityDisplayInfo('delayed')

      expect(info.label).toBe('Задержка 1-2 дня')
      expect(info.color).toBe('yellow')
    })

    it('returns correct info for pending_week with expected date', () => {
      const expectedDate = new Date('2026-02-03')
      const info = getAvailabilityDisplayInfo('pending_week', expectedDate)

      expect(info.label).toBe('Ожидание отчёта')
      expect(info.color).toBe('gray')
      expect(info.description).toContain('3 февраля')
    })

    it('returns correct info for pending_week without expected date', () => {
      const info = getAvailabilityDisplayInfo('pending_week')

      expect(info.label).toBe('Ожидание отчёта')
      expect(info.description).toContain('после закрытия недели')
    })

    it('returns correct info for unavailable', () => {
      const info = getAvailabilityDisplayInfo('unavailable')

      expect(info.label).toBe('Недоступно')
      expect(info.color).toBe('red')
    })
  })

  describe('METRIC_AVAILABILITY', () => {
    it('categorizes realtime metrics correctly', () => {
      expect(METRIC_AVAILABILITY.ordersCount).toBe('realtime')
      expect(METRIC_AVAILABILITY.ordersRevenue).toBe('realtime')
      expect(METRIC_AVAILABILITY.fboOrders).toBe('realtime')
      expect(METRIC_AVAILABILITY.fbsOrders).toBe('realtime')
      expect(METRIC_AVAILABILITY.advertisingSpend).toBe('realtime')
    })

    it('categorizes delayed metrics correctly', () => {
      expect(METRIC_AVAILABILITY.dailySales).toBe('delayed')
      expect(METRIC_AVAILABILITY.retailAmount).toBe('delayed')
      expect(METRIC_AVAILABILITY.ppvzForPay).toBe('delayed')
    })

    it('categorizes pending_week metrics correctly', () => {
      expect(METRIC_AVAILABILITY.salesGross).toBe('pending_week')
      expect(METRIC_AVAILABILITY.logisticsTotal).toBe('pending_week')
      expect(METRIC_AVAILABILITY.storageTotal).toBe('pending_week')
      expect(METRIC_AVAILABILITY.theoreticalProfit).toBe('pending_week')
      expect(METRIC_AVAILABILITY.cogsTotal).toBe('pending_week')
    })
  })
})
