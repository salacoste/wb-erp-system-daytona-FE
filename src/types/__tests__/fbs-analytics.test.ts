/**
 * Tests for FBS Analytics Types
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests validate TypeScript interfaces for FBS analytics API responses.
 */

import { describe, it, expect } from 'vitest'
import type {
  AggregationType,
  SeasonalViewType,
  TrendMetric,
  TrendDataPoint,
  TrendsSummary,
  DataSourceInfo,
  TrendsPeriodInfo,
  TrendsResponse,
  MonthlyPattern,
  WeekdayPattern,
  QuarterlyPattern,
  SeasonalPatterns,
  SeasonalInsights,
  SeasonalResponse,
  PeriodMetrics,
  ComparisonMetrics,
  CompareResponse,
  BackfillStatus,
  BackfillDataSource,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillCabinetStatus,
  BackfillStatusResponse,
  BackfillActionRequest,
  BackfillActionResponse,
  FbsTrendsParams,
  FbsSeasonalParams,
  FbsCompareParams,
  FbsAnalyticsErrorCode,
  FbsAnalyticsError,
} from '@/types/fbs-analytics'

// -- Shared fixtures --

const dataPoint: TrendDataPoint = {
  date: '2025-01-15',
  ordersCount: 10,
  revenue: 5000,
  cancellations: 1,
  cancellationRate: 0.1,
  returns: 2,
  returnRate: 0.2,
  avgOrderValue: 500,
}

const summary: TrendsSummary = {
  totalOrders: 100,
  totalRevenue: 50000,
  avgDailyOrders: 14,
  cancellationRate: 0.05,
  returnRate: 0.03,
}

const periodInfo: TrendsPeriodInfo = {
  from: '2025-01-01',
  to: '2025-01-31',
  aggregation: 'day',
  daysIncluded: 31,
}

const trendsResponse: TrendsResponse = {
  trends: [],
  summary,
  dataSource: { primary: 'orders_fbs' },
  period: periodInfo,
}

const compMetrics: ComparisonMetrics = {
  ordersChange: 10,
  ordersChangePercent: 5.0,
  revenueChange: 5000,
  revenueChangePercent: 10.0,
  cancellationRateChange: -0.02,
  avgOrderValueChange: 50,
  avgOrderValueChangePercent: 5.0,
}

const cabinetStatus: BackfillCabinetStatus = {
  cabinetId: 'cab-123',
  cabinetName: 'Test Cabinet',
  reportsStatus: 'completed',
  analyticsStatus: 'in_progress',
  overallProgress: 65,
  estimatedEta: null,
  errors: [],
}

const makePeriod = (from: string, to: string): PeriodMetrics => ({
  from,
  to,
  ordersCount: 100,
  revenue: 50000,
  cancellationRate: 0.05,
  avgOrderValue: 500,
})

// =============================================================================
// Tests
// =============================================================================

describe('FBS Analytics Types', () => {
  // -- Union type validation helper --
  const acceptsValue = <T>(value: T, expected: T) => {
    expect(value).toBe(expected)
  }

  describe('AggregationType', () => {
    it('accepts "day" as valid aggregation type', () => acceptsValue<AggregationType>('day', 'day'))
    it('accepts "week" as valid aggregation type', () =>
      acceptsValue<AggregationType>('week', 'week'))
    it('accepts "month" as valid aggregation type', () =>
      acceptsValue<AggregationType>('month', 'month'))
  })

  describe('SeasonalViewType', () => {
    it('accepts "monthly"', () => acceptsValue<SeasonalViewType>('monthly', 'monthly'))
    it('accepts "weekly"', () => acceptsValue<SeasonalViewType>('weekly', 'weekly'))
    it('accepts "quarterly"', () => acceptsValue<SeasonalViewType>('quarterly', 'quarterly'))
  })

  describe('TrendMetric', () => {
    it('accepts "orders"', () => acceptsValue<TrendMetric>('orders', 'orders'))
    it('accepts "revenue"', () => acceptsValue<TrendMetric>('revenue', 'revenue'))
    it('accepts "cancellations"', () => acceptsValue<TrendMetric>('cancellations', 'cancellations'))
  })

  describe('TrendDataPoint', () => {
    it('has required date field as string', () => expect(dataPoint.date).toBeTypeOf('string'))
    it('has required ordersCount field as number', () =>
      expect(dataPoint.ordersCount).toBeTypeOf('number'))
    it('has required revenue field as number', () => expect(dataPoint.revenue).toBeTypeOf('number'))
    it('has required cancellations field as number', () =>
      expect(dataPoint.cancellations).toBeTypeOf('number'))
    it('has required cancellationRate field as number', () =>
      expect(dataPoint.cancellationRate).toBeTypeOf('number'))
    it('has required returns field as number', () => expect(dataPoint.returns).toBeTypeOf('number'))
    it('has required returnRate field as number', () =>
      expect(dataPoint.returnRate).toBeTypeOf('number'))
    it('has required avgOrderValue field as number', () =>
      expect(dataPoint.avgOrderValue).toBeTypeOf('number'))

    it('supports daily date format YYYY-MM-DD', () => {
      const p: TrendDataPoint = { ...dataPoint, date: '2025-01-15' }
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('supports weekly date format YYYY-Www', () => {
      const p: TrendDataPoint = { ...dataPoint, date: '2025-W03' }
      expect(p.date).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('TrendsSummary', () => {
    it('has required totalOrders field as number', () =>
      expect(summary.totalOrders).toBeTypeOf('number'))
    it('has required totalRevenue field as number', () =>
      expect(summary.totalRevenue).toBeTypeOf('number'))
    it('has required avgDailyOrders field as number', () =>
      expect(summary.avgDailyOrders).toBeTypeOf('number'))
    it('has required cancellationRate field as number', () =>
      expect(summary.cancellationRate).toBeTypeOf('number'))
    it('has required returnRate field as number', () =>
      expect(summary.returnRate).toBeTypeOf('number'))
  })

  describe('DataSourceInfo', () => {
    it('has required primary field', () => {
      const ds: DataSourceInfo = { primary: 'orders_fbs' }
      expect(ds.primary).toBeTypeOf('string')
    })
    it('accepts "orders_fbs"', () =>
      expect(({ primary: 'orders_fbs' } as DataSourceInfo).primary).toBe('orders_fbs'))
    it('accepts "reports"', () =>
      expect(({ primary: 'reports' } as DataSourceInfo).primary).toBe('reports'))
    it('accepts "analytics"', () =>
      expect(({ primary: 'analytics' } as DataSourceInfo).primary).toBe('analytics'))
  })

  describe('TrendsPeriodInfo', () => {
    it('has from as date string', () => expect(periodInfo.from).toBeTypeOf('string'))
    it('has to as date string', () => expect(periodInfo.to).toBeTypeOf('string'))
    it('has aggregation as AggregationType', () =>
      expect(['day', 'week', 'month']).toContain(periodInfo.aggregation))
    it('has daysIncluded as number', () => expect(periodInfo.daysIncluded).toBeTypeOf('number'))
  })

  describe('TrendsResponse', () => {
    it('has trends as array', () => expect(Array.isArray(trendsResponse.trends)).toBe(true))
    it('has summary as TrendsSummary', () =>
      expect(trendsResponse.summary).toHaveProperty('totalOrders'))
    it('has dataSource as DataSourceInfo', () =>
      expect(trendsResponse.dataSource).toHaveProperty('primary'))
    it('has period as TrendsPeriodInfo', () => {
      const { period } = trendsResponse
      expect(period).toHaveProperty('from')
      expect(period).toHaveProperty('daysIncluded')
    })
    it('trends array can be empty', () => expect(trendsResponse.trends).toHaveLength(0))
    it('accepts 90 daily data points', () => {
      const points: TrendDataPoint[] = Array.from({ length: 90 }, (_, i) => ({
        ...dataPoint,
        date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      }))
      const res: TrendsResponse = {
        ...trendsResponse,
        trends: points,
        period: { ...periodInfo, daysIncluded: 90 },
      }
      expect(res.trends).toHaveLength(90)
    })
    it('accepts 52 weekly data points for 365 days', () => {
      const points: TrendDataPoint[] = Array.from({ length: 52 }, (_, i) => ({
        ...dataPoint,
        date: `2025-W${String(i + 1).padStart(2, '0')}`,
      }))
      const res: TrendsResponse = {
        ...trendsResponse,
        trends: points,
        period: { ...periodInfo, aggregation: 'week', daysIncluded: 365 },
      }
      expect(res.trends).toHaveLength(52)
      expect(res.period.daysIncluded).toBe(365)
    })
  })

  // -- Seasonal Types --

  describe('MonthlyPattern', () => {
    const mp: MonthlyPattern = { month: 'January', avgOrders: 150, avgRevenue: 75000 }
    it('has month as string', () => expect(mp.month).toBeTypeOf('string'))
    it('has avgOrders as number', () => expect(mp.avgOrders).toBeTypeOf('number'))
    it('has avgRevenue as number', () => expect(mp.avgRevenue).toBeTypeOf('number'))
    it('month is full name like "January"', () => {
      expect([
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]).toContain(mp.month)
    })
  })

  describe('WeekdayPattern', () => {
    const wp: WeekdayPattern = { dayOfWeek: 'Monday', avgOrders: 25 }
    it('has dayOfWeek as string', () => expect(wp.dayOfWeek).toBeTypeOf('string'))
    it('has avgOrders as number', () => expect(wp.avgOrders).toBeTypeOf('number'))
    it('dayOfWeek is full name like "Monday"', () => {
      expect([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]).toContain(wp.dayOfWeek)
    })
  })

  describe('QuarterlyPattern', () => {
    const qp: QuarterlyPattern = { quarter: 'Q1', avgOrders: 450, avgRevenue: 225000 }
    it('has quarter as string', () => expect(qp.quarter).toBeTypeOf('string'))
    it('has avgOrders as number', () => expect(qp.avgOrders).toBeTypeOf('number'))
    it('has avgRevenue as number', () => expect(qp.avgRevenue).toBeTypeOf('number'))
    it('quarter format is like "Q1"', () => expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(qp.quarter))
  })

  describe('SeasonalPatterns', () => {
    it('all fields can be undefined', () => {
      const sp: SeasonalPatterns = {}
      expect(sp.monthly).toBeUndefined()
      expect(sp.weekday).toBeUndefined()
      expect(sp.quarterly).toBeUndefined()
    })
    it('monthly contains 12 elements when present', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      const sp: SeasonalPatterns = {
        monthly: months.map(m => ({ month: m, avgOrders: 100, avgRevenue: 50000 })),
      }
      expect(sp.monthly).toHaveLength(12)
    })
    it('weekday contains 7 elements when present', () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const sp: SeasonalPatterns = { weekday: days.map(d => ({ dayOfWeek: d, avgOrders: 20 })) }
      expect(sp.weekday).toHaveLength(7)
    })
    it('quarterly contains 4 elements when present', () => {
      const sp: SeasonalPatterns = {
        quarterly: ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
          quarter: q,
          avgOrders: 300,
          avgRevenue: 150000,
        })),
      }
      expect(sp.quarterly).toHaveLength(4)
    })
    it('has optional monthly field as array', () => {
      const sp: SeasonalPatterns = { monthly: [{ month: 'Jan', avgOrders: 10, avgRevenue: 1000 }] }
      expect(Array.isArray(sp.monthly)).toBe(true)
    })
    it('has optional weekday field as array', () => {
      const sp: SeasonalPatterns = { weekday: [{ dayOfWeek: 'Mon', avgOrders: 5 }] }
      expect(Array.isArray(sp.weekday)).toBe(true)
    })
    it('has optional quarterly field as array', () => {
      const sp: SeasonalPatterns = {
        quarterly: [{ quarter: 'Q1', avgOrders: 50, avgRevenue: 5000 }],
      }
      expect(Array.isArray(sp.quarterly)).toBe(true)
    })
  })

  describe('SeasonalInsights', () => {
    const si: SeasonalInsights = {
      peakMonth: 'December',
      lowMonth: 'February',
      peakDayOfWeek: 'Friday',
      seasonalityIndex: 0.75,
    }
    it('has peakMonth as string', () => expect(si.peakMonth).toBeTypeOf('string'))
    it('has lowMonth as string', () => expect(si.lowMonth).toBeTypeOf('string'))
    it('has peakDayOfWeek as string', () => expect(si.peakDayOfWeek).toBeTypeOf('string'))
    it('has seasonalityIndex as number', () => expect(si.seasonalityIndex).toBeTypeOf('number'))
    it('seasonalityIndex is between 0 and 1', () => {
      expect(si.seasonalityIndex).toBeGreaterThanOrEqual(0)
      expect(si.seasonalityIndex).toBeLessThanOrEqual(1)
    })
  })

  describe('SeasonalResponse', () => {
    const sr: SeasonalResponse = {
      patterns: {},
      insights: {
        peakMonth: 'December',
        lowMonth: 'February',
        peakDayOfWeek: 'Friday',
        seasonalityIndex: 0.75,
      },
    }
    it('has patterns field', () => expect(typeof sr.patterns).toBe('object'))
    it('has insights field with all required properties', () => {
      expect(sr.insights).toHaveProperty('peakMonth')
      expect(sr.insights).toHaveProperty('seasonalityIndex')
    })
  })

  // -- Compare Types --

  describe('PeriodMetrics', () => {
    const pm = makePeriod('2025-01-01', '2025-01-31')
    it('has from as string', () => expect(pm.from).toBeTypeOf('string'))
    it('has to as string', () => expect(pm.to).toBeTypeOf('string'))
    it('has ordersCount as number', () => expect(pm.ordersCount).toBeTypeOf('number'))
    it('has revenue as number', () => expect(pm.revenue).toBeTypeOf('number'))
    it('has cancellationRate as number', () => expect(pm.cancellationRate).toBeTypeOf('number'))
    it('has avgOrderValue as number', () => expect(pm.avgOrderValue).toBeTypeOf('number'))
  })

  describe('ComparisonMetrics', () => {
    it('has required ordersChange field as number', () =>
      expect(compMetrics.ordersChange).toBeTypeOf('number'))
    it('has required ordersChangePercent field as number', () =>
      expect(compMetrics.ordersChangePercent).toBeTypeOf('number'))
    it('has required revenueChange field as number', () =>
      expect(compMetrics.revenueChange).toBeTypeOf('number'))
    it('has required revenueChangePercent field as number', () =>
      expect(compMetrics.revenueChangePercent).toBeTypeOf('number'))
    it('has required cancellationRateChange field as number', () =>
      expect(compMetrics.cancellationRateChange).toBeTypeOf('number'))
    it('has required avgOrderValueChange field as number', () =>
      expect(compMetrics.avgOrderValueChange).toBeTypeOf('number'))
    it('has required avgOrderValueChangePercent field as number', () =>
      expect(compMetrics.avgOrderValueChangePercent).toBeTypeOf('number'))
    it('change values can be negative', () => {
      const neg: ComparisonMetrics = { ...compMetrics, ordersChange: -15, revenueChange: -3000 }
      expect(neg.ordersChange).toBeLessThan(0)
      expect(neg.revenueChange).toBeLessThan(0)
    })
    it('percent values can be negative', () => {
      const neg: ComparisonMetrics = {
        ...compMetrics,
        ordersChangePercent: -2.5,
        revenueChangePercent: -5.0,
        avgOrderValueChangePercent: -1.5,
      }
      expect(neg.ordersChangePercent).toBeLessThan(0)
      expect(neg.revenueChangePercent).toBeLessThan(0)
      expect(neg.avgOrderValueChangePercent).toBeLessThan(0)
    })
  })

  describe('CompareResponse', () => {
    const cr: CompareResponse = {
      period1: makePeriod('2025-01-01', '2025-01-31'),
      period2: makePeriod('2024-01-01', '2024-01-31'),
      comparison: compMetrics,
    }
    it('has period1 as PeriodMetrics', () => {
      expect(cr.period1).toHaveProperty('from')
      expect(cr.period1).toHaveProperty('ordersCount')
    })
    it('has period2 as PeriodMetrics', () => {
      expect(cr.period2).toHaveProperty('from')
      expect(cr.period2).toHaveProperty('to')
    })
    it('has comparison as ComparisonMetrics', () => {
      expect(cr.comparison).toHaveProperty('ordersChange')
      expect(cr.comparison).toHaveProperty('revenueChange')
    })
  })

  // -- Backfill Types --

  describe('BackfillStatus', () => {
    const statuses: BackfillStatus[] = ['pending', 'in_progress', 'completed', 'failed', 'paused']
    statuses.forEach(s => {
      it(`accepts "${s}"`, () => expect(s).toBe(s))
    })
  })

  describe('BackfillDataSource', () => {
    it('accepts "reports"', () => acceptsValue<BackfillDataSource>('reports', 'reports'))
    it('accepts "analytics"', () => acceptsValue<BackfillDataSource>('analytics', 'analytics'))
    it('accepts "both"', () => acceptsValue<BackfillDataSource>('both', 'both'))
  })

  describe('StartBackfillRequest', () => {
    it('has optional cabinetId', () => {
      const req: StartBackfillRequest = { dataSource: 'both' }
      expect(req.cabinetId).toBeUndefined()
    })
    it('has required dataSource', () => {
      const req: StartBackfillRequest = { dataSource: 'reports' }
      expect(req.dataSource).toBe('reports')
    })
    it('has optional dateFrom', () => {
      const req: StartBackfillRequest = { dataSource: 'both', dateFrom: '2025-01-01' }
      expect(req.dateFrom).toBe('2025-01-01')
    })
    it('has optional dateTo', () => {
      const req: StartBackfillRequest = { dataSource: 'both', dateTo: '2025-06-01' }
      expect(req.dateTo).toBe('2025-06-01')
    })
    it('has optional priority', () => {
      const req: StartBackfillRequest = { dataSource: 'both', priority: 1 }
      expect(req.priority).toBe(1)
    })
    it('omitting cabinetId means all cabinets', () => {
      const req: StartBackfillRequest = { dataSource: 'both' }
      expect(req.cabinetId).toBeUndefined()
    })
  })

  describe('StartBackfillResponse', () => {
    const res: StartBackfillResponse = {
      success: true,
      message: 'Started',
      jobCount: 3,
      jobIds: ['j1', 'j2', 'j3'],
    }
    it('has success as boolean', () => expect(res.success).toBeTypeOf('boolean'))
    it('has message as string', () => expect(res.message).toBeTypeOf('string'))
    it('has jobCount as number', () => expect(res.jobCount).toBeTypeOf('number'))
    it('has jobIds as string array', () => {
      expect(Array.isArray(res.jobIds)).toBe(true)
      res.jobIds.forEach(id => expect(id).toBeTypeOf('string'))
    })
  })

  describe('BackfillCabinetStatus', () => {
    it('has required cabinetId', () => expect(cabinetStatus.cabinetId).toBe('cab-123'))
    it('has required cabinetName', () => expect(cabinetStatus.cabinetName).toBe('Test Cabinet'))
    it('has reportsStatus as BackfillStatus', () => {
      expect(['pending', 'in_progress', 'completed', 'failed', 'paused']).toContain(
        cabinetStatus.reportsStatus
      )
    })
    it('has analyticsStatus as BackfillStatus', () => {
      expect(['pending', 'in_progress', 'completed', 'failed', 'paused']).toContain(
        cabinetStatus.analyticsStatus
      )
    })
    it('has overallProgress as number 0-100', () => {
      expect(cabinetStatus.overallProgress).toBeGreaterThanOrEqual(0)
      expect(cabinetStatus.overallProgress).toBeLessThanOrEqual(100)
    })
    it('has estimatedEta as string or null', () => {
      const withEta: BackfillCabinetStatus = {
        ...cabinetStatus,
        estimatedEta: '2025-06-08T12:00:00Z',
      }
      expect(withEta.estimatedEta).toBeTypeOf('string')
      expect(cabinetStatus.estimatedEta).toBeNull()
    })
    it('has errors as string array', () => {
      const withErrors: BackfillCabinetStatus = { ...cabinetStatus, errors: ['timeout'] }
      expect(Array.isArray(withErrors.errors)).toBe(true)
      withErrors.errors.forEach(e => expect(e).toBeTypeOf('string'))
    })
  })

  describe('BackfillStatusResponse', () => {
    it('is array of BackfillCabinetStatus', () => {
      const res: BackfillStatusResponse = [cabinetStatus]
      expect(Array.isArray(res)).toBe(true)
      expect(res[0].cabinetId).toBe('cab-123')
    })
    it('can be empty array', () => {
      const res: BackfillStatusResponse = []
      expect(res).toHaveLength(0)
    })
  })

  describe('BackfillActionRequest', () => {
    it('has required cabinetId', () => {
      const req: BackfillActionRequest = { cabinetId: 'cab-123' }
      expect(req.cabinetId).toBe('cab-123')
    })
  })

  describe('BackfillActionResponse', () => {
    const res: BackfillActionResponse = { success: true, message: 'Done' }
    it('has success as boolean', () => expect(res.success).toBeTypeOf('boolean'))
    it('has message as string', () => expect(res.message).toBeTypeOf('string'))
  })

  // -- Query Parameter Types --

  describe('FbsTrendsParams', () => {
    it('has required from as string', () => {
      const p: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31' }
      expect(p.from).toBeTypeOf('string')
    })
    it('has required to as string', () => {
      const p: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31' }
      expect(p.to).toBeTypeOf('string')
    })
    it('has optional aggregation', () => {
      const withAgg: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31', aggregation: 'week' }
      const without: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31' }
      expect(withAgg.aggregation).toBe('week')
      expect(without.aggregation).toBeUndefined()
    })
    it('has optional metrics as array', () => {
      const p: FbsTrendsParams = {
        from: '2025-01-01',
        to: '2025-01-31',
        metrics: ['orders', 'revenue'],
      }
      expect(Array.isArray(p.metrics)).toBe(true)
    })
    it('from is YYYY-MM-DD', () => {
      const p: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31' }
      expect(p.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
    it('to is YYYY-MM-DD', () => {
      const p: FbsTrendsParams = { from: '2025-01-01', to: '2025-01-31' }
      expect(p.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('FbsSeasonalParams', () => {
    it('has optional months as number', () => {
      const withM: FbsSeasonalParams = { months: 6 }
      expect(withM.months).toBeTypeOf('number')
      expect(({} as FbsSeasonalParams).months).toBeUndefined()
    })
    it('has optional view as SeasonalViewType', () => {
      const withV: FbsSeasonalParams = { view: 'monthly' }
      expect(['monthly', 'weekly', 'quarterly']).toContain(withV.view)
    })
    it('months range is 1-12', () => {
      const p: FbsSeasonalParams = { months: 6 }
      expect(p.months!).toBeGreaterThanOrEqual(1)
      expect(p.months!).toBeLessThanOrEqual(12)
    })
  })

  describe('FbsCompareParams', () => {
    const p: FbsCompareParams = {
      period1From: '2025-01-01',
      period1To: '2025-01-31',
      period2From: '2024-01-01',
      period2To: '2024-01-31',
    }
    it('has required period1From', () => expect(p.period1From).toBe('2025-01-01'))
    it('has required period1To', () => expect(p.period1To).toBe('2025-01-31'))
    it('has required period2From', () => expect(p.period2From).toBe('2024-01-01'))
    it('has required period2To', () => expect(p.period2To).toBe('2024-01-31'))
    it('all date fields are YYYY-MM-DD', () => {
      const re = /^\d{4}-\d{2}-\d{2}$/
      expect(p.period1From).toMatch(re)
      expect(p.period1To).toMatch(re)
      expect(p.period2From).toMatch(re)
      expect(p.period2To).toMatch(re)
    })
  })

  // -- Error Types --

  describe('FbsAnalyticsErrorCode', () => {
    const codes: FbsAnalyticsErrorCode[] = [
      'INVALID_DATE_FORMAT',
      'INVALID_DATE_RANGE',
      'DATE_RANGE_EXCEEDED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'CABINET_NOT_FOUND',
    ]
    codes.forEach(code => {
      it(`accepts "${code}"`, () => expect(code).toBe(code))
    })
  })

  describe('FbsAnalyticsError', () => {
    const err: FbsAnalyticsError = { error: { code: 'INVALID_DATE_FORMAT', message: 'Bad date' } }
    it('has error object with code field', () => expect(err.error.code).toBe('INVALID_DATE_FORMAT'))
    it('has error object with message field', () => expect(err.error.message).toBeTypeOf('string'))
  })
})
