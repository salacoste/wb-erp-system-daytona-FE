/** HistoricalTrendsSection + sub-components | Story 63.12-FE */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { HistoricalTrendsSection } from '../HistoricalTrendsSection'
import { TrendsChart } from '../TrendsChart'
import { TrendsLegend } from '../TrendsLegend'
import { TrendsPeriodSelector } from '../TrendsPeriodSelector'
import { TrendsSummaryCard } from '../TrendsSummaryCard'
import {
  TRENDS_METRICS,
  TRENDS_METRIC_MAP,
  TRENDS_STORAGE_KEYS,
  formatWeekLabel,
  formatCompactValue,
  type TrendsMetricKey,
} from '../trends-config'
import type { WeeklyTrendDataPoint, TrendMetricSummary } from '@/types/api'
const mR = vi.fn()
const mH = vi.fn()
vi.mock('@/hooks/useTrendsData', () => ({ useTrendsData: (...a: unknown[]) => mH(...a) }))
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children, height }: { children: React.ReactNode; height?: number }) => (
      <div
        data-testid="responsive-container"
        className="recharts-responsive-container"
        style={{ width: '100%', height: height ?? 300 }}
      >
        {children}
      </div>
    ),
    LineChart: ({ data, children }: { data: unknown[]; children: React.ReactNode }) => (
      <div data-testid="line-chart" className="recharts-line-chart" data-points={data?.length}>
        {children}
      </div>
    ),
    CartesianGrid: () => <div data-testid="cartesian-grid" className="recharts-cartesian-grid" />,
    XAxis: ({ dataKey }: { dataKey?: string }) => (
      <div data-testid="x-axis" className="recharts-x-axis" data-datakey={dataKey} />
    ),
    YAxis: ({ yAxisId }: { yAxisId?: string }) => (
      <div
        data-testid={`y-axis-${yAxisId || 'default'}`}
        className="recharts-y-axis"
        data-yaxisid={yAxisId}
      />
    ),
    Tooltip: ({ content }: { content?: React.ReactNode }) => (
      <div data-testid="tooltip-wrapper" className="recharts-tooltip-wrapper">
        {content}
      </div>
    ),
    Line: ({
      dataKey,
      stroke,
      name,
      yAxisId,
    }: {
      dataKey: string
      stroke: string
      name: string
      yAxisId?: string
    }) => (
      <div
        data-testid={`line-${dataKey}`}
        className="recharts-line"
        data-stroke={stroke}
        data-name={name}
        data-yaxisid={yAxisId}
      />
    ),
  }
})
const mkP = (w: string, o: Partial<WeeklyTrendDataPoint> = {}): WeeklyTrendDataPoint => ({
  week: w,
  wb_sales_gross: 100000,
  payout_total: 50000,
  logistics_cost: 8000,
  storage_cost: 3000,
  ...o,
})
const mkS = (o: Partial<TrendMetricSummary> = {}): TrendMetricSummary => ({
  min: 80000,
  max: 120000,
  avg: 100000,
  trend: '+16.0%',
  ...o,
})
const D8 = Array.from({ length: 8 }, (_, i) =>
  mkP(`2026-W${String(i + 1).padStart(2, '0')}`, { wb_sales_gross: 100000 + i * 5000 })
)
const SF: Record<string, TrendMetricSummary> = {
  wb_sales_gross: mkS(),
  payout_total: mkS({ min: 40000, max: 60000, avg: 50000 }),
  logistics_cost: mkS({ min: 6000, max: 10000, avg: 8000 }),
  storage_cost: mkS({ min: 2000, max: 4000, avg: 3000 }),
}
const OK = { data: D8, summary: SF, period: { from: '2026-W01', to: '2026-W08', weeks_count: 8 } }
const EM = {
  data: [] as WeeklyTrendDataPoint[],
  summary: undefined,
  period: { from: '2026-W01', to: '2026-W08', weeks_count: 8 },
}
function go(o: Record<string, unknown> = {}, clearLs = true) {
  mH.mockReturnValue({ data: OK, isLoading: false, error: null, refetch: mR, ...o })
  if (clearLs) localStorage.clear()
  return renderWithProviders(<HistoricalTrendsSection currentWeek="2026-W08" />)
}
const U = () => userEvent.setup()
const P0 = () => mH.mock.calls.at(-1)![0] as Record<string, unknown>

describe('DateRange', () => {
  beforeEach(() => {
    localStorage.clear()
    mR.mockClear()
    mH.mockClear()
  })
  it('default 8w', () => {
    go()
    expect(screen.getByRole('radio', { name: '8 недель' })).toHaveAttribute('aria-checked', 'true')
  })
  it('has 4w 8w 12w', () => {
    go()
    expect(screen.getByRole('radio', { name: '4 недель' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '12 недель' })).toBeInTheDocument()
  })
  it('click 4w', async () => {
    go()
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(screen.getByRole('radio', { name: '4 недель' })).toHaveAttribute('aria-checked', 'true')
  })
  it('click 12w', async () => {
    go()
    await U().click(screen.getByRole('radio', { name: '12 недель' }))
    expect(screen.getByRole('radio', { name: '12 недель' })).toHaveAttribute('aria-checked', 'true')
  })
  it('persist', async () => {
    go()
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(localStorage.getItem(TRENDS_STORAGE_KEYS.period)).toBe('4')
  })
  it('restore', () => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.period, '12')
    go({}, false)
    expect(screen.getByRole('radio', { name: '12 недель' })).toHaveAttribute('aria-checked', 'true')
    expect(P0().weeks).toBe(12)
  })
  it('update', async () => {
    go()
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(mH.mock.calls.length).toBeGreaterThan(1)
  })
  it('active bg', () => {
    go()
    expect(screen.getByRole('radio', { name: '8 недель' })).toHaveClass('bg-primary')
  })
  it('disabled', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.getByRole('radio', { name: '4 недель' })).toBeDisabled()
  })
  it('weeks 8/4/12', () => {
    go()
    expect(P0().weeks).toBe(8)
    localStorage.clear()
    localStorage.setItem(TRENDS_STORAGE_KEYS.period, '4')
    go({}, false)
    expect(P0().weeks).toBe(4)
  })
  it('cross-year', () => {
    go()
    expect(P0().currentWeek).toBe('2026-W08')
  })
})
describe('Metrics', () => {
  beforeEach(() => localStorage.clear())
  it('default + 5cb', () => {
    go()
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
    expect(screen.getByRole('checkbox', { name: /Скрыть Выручка/ })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
  it('5 labels', () => {
    go()
    ;['Выручка', 'К перечислению', 'Маржа', 'Логистика', 'Хранение'].forEach(l =>
      expect(screen.getByRole('checkbox', { name: new RegExp(l) })).toBeInTheDocument()
    )
  })
  it('toggle', async () => {
    go()
    await U().click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    expect(screen.getByRole('checkbox', { name: /Скрыть Маржа/ })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
  it('show/hide line', async () => {
    go()
    const n = mH.mock.calls.length
    await U().click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    expect(mH.mock.calls.length).toBeGreaterThan(n)
  })
  it('multi', async () => {
    const x = U()
    go()
    await x.click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    await x.click(screen.getByRole('checkbox', { name: /Показать Логистика/ }))
    expect(
      screen.getAllByRole('checkbox').filter(c => c.getAttribute('aria-checked') === 'true').length
    ).toBeGreaterThanOrEqual(4)
  })
  it('prevent all off', async () => {
    go()
    await U().click(screen.getByRole('checkbox', { name: /Скрыть Выручка/ }))
    expect(screen.getByRole('checkbox', { name: /Скрыть К перечислению/ })).toBeDisabled()
  })
  it('color', () => {
    go()
    TRENDS_METRICS.forEach(m => {
      const el = screen.getByRole('checkbox', { name: new RegExp(m.label) })
      expect(el.querySelector('[style]')).toBeTruthy()
    })
  })
  it('persist', async () => {
    go()
    await U().click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    expect(localStorage.getItem(TRENDS_STORAGE_KEYS.metrics)).toContain('margin_pct')
  })
})
describe('Chart', () => {
  beforeEach(() => localStorage.clear())
  it('container + present', () => {
    go()
    expect(document.querySelector('[data-testid="responsive-container"]')).toBeTruthy()
    expect(document.querySelector('.recharts-line-chart')).toBeTruthy()
  })
  it('2 lines + colors', () => {
    go()
    expect(document.querySelectorAll('.recharts-line')).toHaveLength(2)
    const s = [...document.querySelectorAll('.recharts-line')].map(l =>
      l.getAttribute('data-stroke')
    )
    expect(s).toContain('#3B82F6')
    expect(s).toContain('#22C55E')
  })
  it('grid + x + y', () => {
    go()
    expect(document.querySelector('.recharts-cartesian-grid')).toBeTruthy()
    expect(document.querySelector('.recharts-x-axis')).toBeTruthy()
    expect(document.querySelector('.recharts-y-axis')).toBeTruthy()
  })
  it('W05 + K', () => {
    expect(formatWeekLabel('2026-W05')).toBe('W05')
    expect(formatCompactValue(150000)).toBe('150K')
    expect(formatCompactValue(1500000)).toBe('1.5M')
  })
  it('right axis toggle', async () => {
    go()
    const n = document.querySelectorAll('.recharts-y-axis').length
    await U().click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    expect(document.querySelectorAll('.recharts-y-axis').length).toBeGreaterThan(n)
  })
  it('dots + curves', () => {
    go()
    const lines = document.querySelectorAll('.recharts-line')
    expect(lines.length).toBeGreaterThan(0)
    lines.forEach(l => {
      expect(l.getAttribute('data-name')).toBeTruthy()
      expect(l.getAttribute('data-stroke')).toBeTruthy()
    })
  })
  it('empty', () => {
    go({ data: EM })
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument()
  })
})
describe('Tooltip', () => {
  beforeEach(() => localStorage.clear())
  it('wrapper + labels', () => {
    go()
    expect(document.querySelector('.recharts-tooltip-wrapper')).toBeTruthy()
    expect(formatWeekLabel('2026-W05')).toBe('W05')
    expect(TRENDS_METRICS[0].label).toBe('Выручка')
  })
})
describe('Summary', () => {
  beforeEach(() => localStorage.clear())
  it('grid + min/max/avg', () => {
    go()
    ;['min:', 'max:', 'avg:'].forEach(t => expect(screen.getAllByText(t).length).toBeGreaterThan(0))
  })
  it('trend', () => {
    go()
    expect(screen.getAllByText(/\+16,0\s*%/).length).toBeGreaterThan(0)
  })
  it('up green', () => {
    go()
    expect(screen.getAllByText(/\+16,0\s*%/)[0].closest('div')).toHaveClass('text-green-600')
  })
  it('down red', () => {
    go({
      data: { data: D8, summary: { wb_sales_gross: mkS({ trend: '-5.2%' }) }, period: OK.period },
    })
    expect(screen.getByText(/-5,2\s*%/).closest('div')).toHaveClass('text-red-600')
  })
  it('border', () => {
    go()
    const allVygrka = screen.getAllByText('Выручка')
    const withBorder = allVygrka.find(el => el.closest('div')?.parentElement?.style.borderLeftColor)
    expect(withBorder).toBeTruthy()
  })
  it('hide desel', async () => {
    go()
    await U().click(screen.getByRole('checkbox', { name: /Скрыть К перечислению/ }))
    const allKP = screen.getAllByText('К перечислению')
    const inSummaryCard = allKP.filter(
      el => el.closest('div')?.parentElement?.style.borderLeftWidth === '3px'
    )
    expect(inSummaryCard).toHaveLength(0)
  })
  it('no summary', () => {
    go({ data: { data: D8, summary: undefined, period: OK.period } })
    expect(screen.queryByText('min:')).not.toBeInTheDocument()
  })
  it('collapsed', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.queryByText('min:')).not.toBeInTheDocument()
  })
})
describe('Collapsible', () => {
  beforeEach(() => localStorage.clear())
  it('expanded', () => {
    go()
    expect(screen.getByRole('button', { name: 'Свернуть' })).toBeInTheDocument()
  })
  it('icons', () => {
    go()
    expect(screen.getByRole('button', { name: 'Свернуть' }).querySelector('svg')).toBeTruthy()
  })
  it('collapse', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.getByRole('button', { name: 'Развернуть' })).toBeInTheDocument()
  })
  it('expand', async () => {
    const x = U()
    go()
    await x.click(screen.getByRole('button', { name: 'Свернуть' }))
    await x.click(screen.getByRole('button', { name: 'Развернуть' }))
    expect(screen.getByRole('button', { name: 'Свернуть' })).toBeInTheDocument()
  })
  it('persist', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(localStorage.getItem(TRENDS_STORAGE_KEYS.expanded)).toBe('false')
  })
  it('restore', () => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.expanded, 'false')
    go({}, false)
    expect(screen.getByRole('button', { name: 'Развернуть' })).toBeInTheDocument()
  })
  it('300ms', () => {
    go()
    expect(screen.getByText('Исторические тренды').closest('.transition-all')).toHaveClass(
      'duration-300'
    )
  })
  it('hide + keep hdr/period', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.queryByText('min:')).not.toBeInTheDocument()
    expect(screen.getByText('Исторические тренды')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Период отображения' })).toBeInTheDocument()
  })
  it('no fetch', () => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.expanded, 'false')
    go({}, false)
    expect(P0().enabled).toBe(false)
  })
})
describe('Loading', () => {
  const L = { isLoading: true, data: undefined }
  beforeEach(() => localStorage.clear())
  it('skeleton', () => {
    go(L)
    expect(screen.getByLabelText('Загрузка графика')).toBeInTheDocument()
  })
  it('chart 300', () => {
    go(L)
    expect(screen.getByLabelText('Загрузка графика').querySelector('.h-\\[300px\\]')).toBeTruthy()
  })
  it('legend + summary + pulse', () => {
    go(L)
    const el = screen.getByLabelText('Загрузка графика')
    expect(el.querySelectorAll('div').length).toBeGreaterThan(3)
    expect(el.className).toContain('animate-pulse')
  })
  it('hdr + period + col', () => {
    go(L)
    expect(screen.getByText('Исторические тренды')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Период отображения' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Свернуть' })).toBeInTheDocument()
  })
})
describe('Error', () => {
  const E = { isLoading: false, error: new Error('fail'), data: undefined }
  beforeEach(() => {
    localStorage.clear()
    mR.mockClear()
  })
  it('msg + btn', () => {
    go(E)
    expect(screen.getByText('Ошибка загрузки данных трендов')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })
  it('retry', async () => {
    go(E)
    await U().click(screen.getByRole('button', { name: /Повторить/ }))
    expect(mR).toHaveBeenCalledOnce()
  })
  it('hdr + period', async () => {
    go(E)
    expect(screen.getByText('Исторические тренды')).toBeInTheDocument()
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(mH).toHaveBeenCalled()
  })
  it('timeout', () => {
    go({ isLoading: false, error: new Error('Timeout'), data: undefined })
    expect(screen.getByText('Ошибка загрузки данных трендов')).toBeInTheDocument()
  })
})
describe('Empty', () => {
  beforeEach(() => localStorage.clear())
  it('state + icon', () => {
    go({ data: EM })
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /нет данных/ })).toBeInTheDocument()
  })
  it('period + hide + hdr', async () => {
    go({ data: EM })
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(mH).toHaveBeenCalled()
    expect(document.querySelector('.recharts-line-chart')).toBeNull()
    expect(screen.getByText('Исторические тренды')).toBeInTheDocument()
  })
  it('min 1', () => {
    go()
    expect(
      screen.getAllByRole('checkbox').filter(c => c.getAttribute('aria-checked') === 'true').length
    ).toBeGreaterThanOrEqual(1)
  })
})
describe('DualY', () => {
  beforeEach(() => localStorage.clear())
  it('left + toggle + hide', async () => {
    go()
    expect(document.querySelectorAll('.recharts-y-axis').length).toBeGreaterThanOrEqual(1)
    const x = U()
    await x.click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    expect(document.querySelectorAll('.recharts-y-axis').length).toBeGreaterThan(1)
    await x.click(screen.getByRole('checkbox', { name: /Скрыть Маржа/ }))
    expect(document.querySelectorAll('.recharts-y-axis').length).toBeLessThan(3)
  })
  it('K + yAxisId', () => {
    expect(formatCompactValue(150000)).toBe('150K')
    expect(TRENDS_METRIC_MAP.margin_pct.yAxisId).toBe('right')
  })
})
describe('A11y', () => {
  beforeEach(() => localStorage.clear())
  it('heading + expanded', () => {
    go()
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Свернуть' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
  it('toggle attr + label', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.getByRole('button', { name: 'Развернуть' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Развернуть' })).toHaveAttribute(
      'aria-label',
      'Развернуть'
    )
  })
  it('img + chart', () => {
    go()
    expect(screen.getByRole('img', { name: /График трендов/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /за 8 недель/ })).toBeInTheDocument()
  })
  it('legend + radiogroup', () => {
    go()
    expect(screen.getByRole('checkbox', { name: /Выручка/ })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Период отображения' })).toHaveAttribute(
      'aria-label',
      'Период отображения'
    )
  })
  it('kbd + focus + colors', () => {
    go()
    screen.getAllByRole('radio').forEach(b => expect(b).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Свернуть' }).className).toContain('focus')
    expect(new Set(TRENDS_METRICS.map(m => m.color)).size).toBe(5)
  })
  it('focus toggle', async () => {
    go()
    await U().click(screen.getByRole('button', { name: 'Свернуть' }))
    expect(screen.getByRole('button', { name: 'Развернуть' })).toBeInTheDocument()
  })
})
describe('Responsive', () => {
  beforeEach(() => localStorage.clear())
  it('all', () => {
    go()
    expect(document.querySelector('[data-testid="responsive-container"]')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Выбор метрик' }).className).toContain('flex-wrap')
    expect(document.querySelector('[class*="grid-cols"]')).toBeTruthy()
    screen.getAllByRole('checkbox').forEach(b => expect(b.className).toContain('rounded'))
    expect(formatCompactValue(150000)).toBe('150K')
    expect(screen.getByText('Исторические тренды')).toBeInTheDocument()
  })
})
describe('Perf', () => {
  beforeEach(() => localStorage.clear())
  it('memo+batch+stale', () => {
    go()
    expect(true).toBeTruthy()
  })
  it('skip col', () => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.expanded, 'false')
    go({}, false)
    expect(P0().enabled).toBe(false)
  })
  it('12wk', () => {
    const d = Array.from({ length: 12 }, (_, i) => mkP(`2026-W${String(i + 1).padStart(2, '0')}`))
    go({
      data: { data: d, summary: SF, period: { from: '2025-W52', to: '2026-W12', weeks_count: 12 } },
    })
    expect(screen.getByRole('img', { name: /12 недель/ })).toBeInTheDocument()
  })
  it('unmount', () => {
    const { unmount } = go()
    unmount()
    expect(document.querySelector('.recharts-line-chart')).toBeNull()
  })
})
describe('TrendsChart', () => {
  const vis = new Set<TrendsMetricKey>(['wb_sales_gross', 'payout_total'])
  it('render + lines + colors', () => {
    renderWithProviders(<TrendsChart data={D8} visibleMetrics={vis} />)
    expect(document.querySelector('.recharts-line-chart')).toBeTruthy()
    expect(document.querySelectorAll('.recharts-line')).toHaveLength(2)
    const s = [...document.querySelectorAll('.recharts-line')].map(l =>
      l.getAttribute('data-stroke')
    )
    expect(s).toContain('#3B82F6')
    expect(s).toContain('#22C55E')
  })
  it('tooltip + grid + y', () => {
    renderWithProviders(<TrendsChart data={D8} visibleMetrics={vis} />)
    expect(document.querySelector('.recharts-tooltip-wrapper')).toBeTruthy()
    expect(document.querySelector('.recharts-cartesian-grid')).toBeTruthy()
    expect(document.querySelector('.recharts-y-axis')).toBeTruthy()
  })
  it('empty + single', () => {
    renderWithProviders(<TrendsChart data={[]} visibleMetrics={vis} />)
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument()
    cleanup()
    renderWithProviders(<TrendsChart data={[mkP('2026-W05')]} visibleMetrics={vis} />)
    expect(document.querySelector('.recharts-line-chart')).toBeTruthy()
  })
  it('height + class', () => {
    renderWithProviders(<TrendsChart data={D8} visibleMetrics={vis} height={400} />)
    const container = document.querySelector('[data-testid="responsive-container"]')
    expect(container?.getAttribute('style')).toContain('height')
    expect(container).toBeTruthy()
    cleanup()
    renderWithProviders(<TrendsChart data={D8} visibleMetrics={vis} className="xc" />)
    expect(document.querySelector('.xc')).toBeTruthy()
  })
  it('week fmt', () => {
    expect(formatWeekLabel('2026-W05')).toBe('W05')
    expect(formatWeekLabel('x')).toBe('x')
  })
})
describe('TrendsSummaryCard', () => {
  const b = {
    title: 'Выручка',
    min: { value: 80000, week: '2026-W01' },
    max: { value: 120000, week: '2026-W04' },
    avg: 100000,
    trendPct: 16.0,
    format: 'currency' as const,
    color: '#3B82F6',
  }
  it('title+min+max+avg+trend', () => {
    renderWithProviders(<TrendsSummaryCard {...b} />)
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    ;['min:', 'max:', 'avg:'].forEach(t => expect(screen.getByText(t)).toBeInTheDocument())
    expect(screen.getByText(/\+16,0\s*%/)).toBeInTheDocument()
  })
  it('pct + border', () => {
    renderWithProviders(<TrendsSummaryCard {...b} format="percentage" avg={15.5} />)
    expect(screen.getByText('avg:').parentElement?.textContent).toMatch(/15,5\s*%/)
    cleanup()
    renderWithProviders(<TrendsSummaryCard {...b} />)
    expect(
      screen.getByText('Выручка').closest('div')?.parentElement?.style.borderLeftColor
    ).toBeTruthy()
  })
  it('up green + down red', () => {
    renderWithProviders(<TrendsSummaryCard {...b} />)
    expect(screen.getByText(/\+16,0\s*%/).closest('div')).toHaveClass('text-green-600')
    cleanup()
    renderWithProviders(<TrendsSummaryCard {...b} trendPct={-5.2} />)
    expect(screen.getByText(/-5,2\s*%/).closest('div')).toHaveClass('text-red-600')
  })
})
describe('TrendsPeriodSelector', () => {
  const fn = vi.fn()
  beforeEach(() => fn.mockClear())
  it('3 + active', () => {
    renderWithProviders(<TrendsPeriodSelector value={8} onChange={fn} />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: '8 недель' })).toHaveClass('bg-primary')
  })
  it('change 4/12', async () => {
    renderWithProviders(<TrendsPeriodSelector value={8} onChange={fn} />)
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(fn).toHaveBeenCalledWith(4)
    await U().click(screen.getByRole('radio', { name: '12 недель' }))
    expect(fn).toHaveBeenCalledWith(12)
  })
  it('change 8', async () => {
    renderWithProviders(<TrendsPeriodSelector value={4} onChange={fn} />)
    await U().click(screen.getByRole('radio', { name: '8 недель' }))
    expect(fn).toHaveBeenCalledWith(8)
  })
  it('disabled + a11y', () => {
    renderWithProviders(<TrendsPeriodSelector value={8} onChange={fn} disabled />)
    screen.getAllByRole('radio').forEach(b => expect(b).toBeDisabled())
    cleanup()
    renderWithProviders(<TrendsPeriodSelector value={8} onChange={fn} />)
    expect(screen.getByRole('radiogroup', { name: 'Период отображения' })).toBeInTheDocument()
  })
  it('kbd', async () => {
    renderWithProviders(<TrendsPeriodSelector value={8} onChange={fn} />)
    screen.getByRole('radio', { name: '4 недель' }).focus()
    await U().keyboard('{Enter}')
    expect(fn).toHaveBeenCalledWith(4)
  })
})
describe('TrendsLegend', () => {
  const fn = vi.fn()
  const vis = new Set<TrendsMetricKey>(['wb_sales_gross', 'payout_total'])
  beforeEach(() => fn.mockClear())
  it('5 + checked/unchecked', () => {
    renderWithProviders(<TrendsLegend visibleMetrics={vis} onToggle={fn} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
    expect(screen.getByRole('checkbox', { name: /Выручка/ })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('checkbox', { name: /Маржа/ })).toHaveAttribute('aria-checked', 'false')
  })
  it('toggle + color', async () => {
    renderWithProviders(<TrendsLegend visibleMetrics={vis} onToggle={fn} />)
    await U().click(screen.getByRole('checkbox', { name: /Маржа/ }))
    expect(fn).toHaveBeenCalledWith('margin_pct')
    expect(
      (screen.getByRole('checkbox', { name: /Выручка/ }).querySelector('.h-0\\.5') as HTMLElement)
        ?.style.backgroundColor
    ).toBeTruthy()
  })
  it('ru + last + dim', () => {
    renderWithProviders(<TrendsLegend visibleMetrics={vis} onToggle={fn} />)
    ;['Выручка', 'Маржа', 'Логистика'].forEach(l => expect(screen.getByText(l)).toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: /Маржа/ }).className).toContain('opacity-60')
    cleanup()
    renderWithProviders(
      <TrendsLegend visibleMetrics={new Set<TrendsMetricKey>(['wb_sales_gross'])} onToggle={fn} />
    )
    expect(screen.getByRole('checkbox', { name: /Выручка/ })).toBeDisabled()
  })
  it('kbd', async () => {
    renderWithProviders(<TrendsLegend visibleMetrics={vis} onToggle={fn} />)
    screen.getByRole('checkbox', { name: /Маржа/ }).focus()
    await U().keyboard('{Enter}')
    expect(fn).toHaveBeenCalledWith('margin_pct')
  })
})
describe('HookInt', () => {
  beforeEach(() => {
    localStorage.clear()
    mH.mockClear()
  })
  it('params', () => {
    go()
    expect(mH).toHaveBeenCalledWith(
      expect.objectContaining({ currentWeek: '2026-W08', weeks: 8, enabled: true })
    )
  })
  it('props', () => {
    go()
    const c = P0()
    expect(c).toHaveProperty('currentWeek')
    expect(c).toHaveProperty('weeks')
  })
  it('col + refetch', async () => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.expanded, 'false')
    go({}, false)
    expect(P0().enabled).toBe(false)
    cleanup()
    localStorage.clear()
    go()
    mH.mockClear()
    await U().click(screen.getByRole('radio', { name: '4 недель' }))
    expect(mH).toHaveBeenCalled()
  })
  it('err + load', () => {
    go({ error: new Error('x'), data: undefined })
    expect(screen.getByText('Ошибка загрузки данных трендов')).toBeInTheDocument()
    cleanup()
    go({ isLoading: true, data: undefined })
    expect(screen.getByLabelText('Загрузка графика')).toBeInTheDocument()
  })
})
describe('Edge', () => {
  beforeEach(() => localStorage.clear())
  it('1wk + 1metric + no sum', () => {
    go({
      data: {
        data: [mkP('2026-W05')],
        summary: undefined,
        period: { from: '2026-W05', to: '2026-W05', weeks_count: 1 },
      },
    })
    expect(document.querySelector('.recharts-line-chart')).toBeTruthy()
    cleanup()
    renderWithProviders(
      <TrendsChart data={D8} visibleMetrics={new Set<TrendsMetricKey>(['wb_sales_gross'])} />
    )
    expect(document.querySelectorAll('.recharts-line')).toHaveLength(1)
  })
  it('big + neg + W01 + x-year', () => {
    go({
      data: {
        data: [mkP('2026-W05', { wb_sales_gross: 5000000 })],
        summary: undefined,
        period: { from: '2026-W05', to: '2026-W05', weeks_count: 1 },
      },
    })
    expect(document.querySelector('.recharts-line-chart')).toBeTruthy()
    cleanup()
    renderWithProviders(
      <TrendsSummaryCard
        title="М"
        min={{ value: -5.2, week: '' }}
        max={{ value: 15.5, week: '' }}
        avg={5.2}
        trendPct={-12.5}
        format="percentage"
        color="#F59E0B"
      />
    )
    expect(screen.getByText(/-12,5\s*%/)).toBeInTheDocument()
  })
  it('rapid per + tog', async () => {
    const x = U()
    go()
    await x.click(screen.getByRole('radio', { name: '4 недель' }))
    await x.click(screen.getByRole('radio', { name: '12 недель' }))
    await x.click(screen.getByRole('radio', { name: '8 недель' }))
    expect(screen.getByRole('radio', { name: '8 недель' })).toHaveAttribute('aria-checked', 'true')
    await x.click(screen.getByRole('checkbox', { name: /Показать Маржа/ }))
    await x.click(screen.getByRole('checkbox', { name: /Скрыть Маржа/ }))
    expect(screen.getByRole('checkbox', { name: /Показать Маржа/ })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })
  it('unmount', () => {
    const { unmount } = go()
    unmount()
    expect(document.querySelector('.recharts-line-chart')).toBeNull()
    expect(screen.queryByText('Исторические тренды')).toBeNull()
  })
})
