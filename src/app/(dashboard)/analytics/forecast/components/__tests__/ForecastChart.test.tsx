/**
 * ForecastChart tests — Story 109.2-FE
 * Covers: getForecastBand pure helper (8 edge cases) + formatConfidence (4 cases) +
 * formatBandRange (3 cases) + ForecastChart component (4 cases) +
 * ForecastChartTooltip (3 cases).
 * Post-1st-pass-review fixes: F-1 (tooltip tests), F-2 (helper unit tests), F-8 (upper assert).
 * jsdom mock pattern from FunnelOverlayChart.test.tsx:6-33 (canonical Pattern 2, Epic 92-FE).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getForecastBand,
  ForecastChart,
  ForecastChartTooltip,
  type TooltipPayloadEntry,
} from '../ForecastChart'
import { formatConfidence, formatBandRange } from '../forecast-chart-helpers'
import type { AiForecastPrediction } from '@/types/ai-forecast'

// Mock window.matchMedia for JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock recharts to avoid canvas/SVG rendering issues in JSDOM
// Canonical pattern from FunnelOverlayChart.test.tsx:21-33 (Pattern 2, Epic 92-FE)
vi.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
}))

// ─── getForecastBand pure helper tests ─────────────────────────────────────────

describe('getForecastBand', () => {
  it('high confidence (0.95) → band uses 10% floor', () => {
    // spread = max(0.10, 1 - 0.95) × 100 = max(0.10, 0.05) × 100 = 0.10 × 100 = 10
    const result = getForecastBand(100, 0.95)
    expect(result.lower).toBeCloseTo(90)
    expect(result.upper).toBeCloseTo(110)
  })

  it('confidence = 1.0 → exactly 10% floor (boundary case)', () => {
    // spread = max(0.10, 1 - 1.0) × 100 = max(0.10, 0) × 100 = 0.10 × 100 = 10
    const result = getForecastBand(100, 1.0)
    expect(result.lower).toBeCloseTo(90)
    expect(result.upper).toBeCloseTo(110)
  })

  it('medium confidence (0.5) → spread = 50% of predictedUnits', () => {
    // spread = max(0.10, 1 - 0.5) × 100 = max(0.10, 0.50) × 100 = 0.50 × 100 = 50
    const result = getForecastBand(100, 0.5)
    expect(result.lower).toBeCloseTo(50)
    expect(result.upper).toBeCloseTo(150)
  })

  it('low confidence (0.1) → spread = 90% of predictedUnits', () => {
    // spread = max(0.10, 1 - 0.1) × 100 = max(0.10, 0.9) × 100 = 0.9 × 100 = 90
    const result = getForecastBand(100, 0.1)
    expect(result.lower).toBeCloseTo(10)
    expect(result.upper).toBeCloseTo(190)
  })

  it('null confidence → treated as 0, spread = 100% of predictedUnits, lower clamped to 0', () => {
    // conf=0, spread = max(0.10, 1 - 0) × 100 = 1 × 100 = 100
    // lower = max(0, 100 - 100) = 0, upper = 200
    const result = getForecastBand(100, null)
    expect(result.lower).toBe(0)
    expect(result.upper).toBeCloseTo(200)
  })

  it('predictedUnits = 0 → both bounds = 0', () => {
    const result = getForecastBand(0, 0.8)
    expect(result.lower).toBe(0)
    expect(result.upper).toBe(0)
  })

  // Epic 113 I1: revenue-target model sends predictedUnits:null → no units band.
  it('predictedUnits = null → both bounds null (no units band, no NaN)', () => {
    const result = getForecastBand(null, 0.8)
    expect(result.lower).toBeNull()
    expect(result.upper).toBeNull()
  })

  it('negative predictedUnits → degenerate flat band (lower = upper = predictedUnits)', () => {
    const result = getForecastBand(-50, 0.7)
    expect(result.lower).toBe(-50)
    expect(result.upper).toBe(-50)
  })

  it('lower bound is clamped to ≥ 0 when spread exceeds predictedUnits', () => {
    // predictedUnits=10, confidence=0 → spread = max(0.10, 1) × 10 = 10
    // lower = max(0, 10 - 10) = 0; upper = 10 + 10 = 20
    const result = getForecastBand(10, 0)
    expect(result.lower).toBe(0)
    // F-8 fix: also assert upper
    expect(result.upper).toBe(20)
  })
})

// ─── formatConfidence unit tests ────────────────────────────────────────────────

describe('formatConfidence', () => {
  it('null → "—" (AP#8 null-vs-zero compliance)', () => {
    expect(formatConfidence(null)).toBe('—')
  })

  it('0.85 → "85 %" (ru-RU comma+NBSP; exact U+00A0)', () => {
    expect(formatConfidence(0.85)).toBe(`85${String.fromCharCode(0xa0)}%`)
  })

  it('1.0 → "100 %"', () => {
    expect(formatConfidence(1.0)).toMatch(/^100\s%$/)
  })

  it('0 → "0 %"', () => {
    expect(formatConfidence(0)).toMatch(/^0\s%$/)
  })
})

// ─── formatBandRange unit tests ─────────────────────────────────────────────────

describe('formatBandRange', () => {
  it('standard: 38.2 lower, 46.7 upper → "38–47" (rounded integers, em-dash separator)', () => {
    const result = formatBandRange(38.2, 46.7)
    expect(result).toBe('38–47')
  })

  it('boundary: 0 lower, 0 upper → "0–0"', () => {
    expect(formatBandRange(0, 0)).toBe('0–0')
  })

  it('separator is U+2013 (en-dash), not hyphen U+002D', () => {
    const result = formatBandRange(10, 20)
    // Extract the separator character between the two numbers
    const separator = result.replace(/\d/g, '')
    expect(separator.charCodeAt(0)).toBe(0x2013)
  })
})

// ─── ForecastChart component tests ─────────────────────────────────────────────

const makePrediction = (overrides: Partial<AiForecastPrediction> = {}): AiForecastPrediction => ({
  date: '2026-01-20',
  horizonDays: 7,
  predictedSales: 42,
  predictedRevenue: null,
  confidence: 0.85,
  naiveBaseline: 35,
  aiVsNaive: '+20%',
  ...overrides,
})

describe('ForecastChart component', () => {
  it('renders all 3 layers: 2 Area elements + 2 Line elements', () => {
    render(<ForecastChart predictions={[makePrediction()]} />)
    const areas = screen.getAllByTestId('area')
    const lines = screen.getAllByTestId('line')
    // 2 Area elements (bandUpper + bandLower) + 2 Line elements (naiveBaseline + predictedSales)
    expect(areas).toHaveLength(2)
    expect(lines).toHaveLength(2)
  })

  it('renders composed-chart wrapper when predictions are non-empty', () => {
    render(<ForecastChart predictions={[makePrediction()]} />)
    expect(screen.getByTestId('composed-chart')).toBeTruthy()
  })

  it('renders empty-state Alert when predictions = []', () => {
    render(<ForecastChart predictions={[]} />)
    expect(screen.queryByTestId('composed-chart')).toBeNull()
    expect(screen.getByText('Нет данных для построения графика прогноза.')).toBeTruthy()
  })

  it('renders CardTitle "График прогноза" when predictions are non-empty', () => {
    render(<ForecastChart predictions={[makePrediction()]} />)
    expect(screen.getByText('График прогноза')).toBeTruthy()
  })
})

// ─── ForecastChartTooltip direct render tests (F-1, AC-8) ──────────────────────
// Renders the tooltip directly (bypassing recharts orchestration) to test AC-8 label requirements.

const makeTooltipPayload = (
  overrides: Partial<TooltipPayloadEntry['payload']> = {}
): TooltipPayloadEntry[] => [
  {
    dataKey: 'predictedSales',
    value: 42,
    payload: {
      date: '2025-01-20',
      dateLabel: '20.01',
      predictedSales: 42,
      naiveBaseline: 35,
      confidence: 0.85,
      bandLower: 38,
      bandUpper: 46,
      ...overrides,
    },
  },
]

describe('ForecastChartTooltip', () => {
  it('renders all 5 Russian labels + values when active with valid payload', () => {
    render(
      <ForecastChartTooltip
        active
        payload={makeTooltipPayload() as Parameters<typeof ForecastChartTooltip>[0]['payload']}
      />
    )
    // AC-8: all 5 Russian labels present
    expect(screen.getByText(/Дата:/)).toBeTruthy()
    expect(screen.getByText(/Прогноз \(AI\)/)).toBeTruthy()
    expect(screen.getByText(/Базовая оценка/)).toBeTruthy()
    expect(screen.getByText(/Уверенность/)).toBeTruthy()
    expect(screen.getByText(/Диапазон/)).toBeTruthy()
    // Values: predictedSales rounded, naiveBaseline rounded, confidence as %, band as "lower–upper"
    expect(screen.getByText(/42/)).toBeTruthy()
    expect(screen.getByText(/35/)).toBeTruthy()
    expect(screen.getByText(/85\s%/)).toBeTruthy() // ru-RU: "85 %" (NBSP); was dot-locale /85%/
    expect(screen.getByText(/38–46/)).toBeTruthy()
  })

  it('null naiveBaseline and null confidence render as "—" (AP#8 compliance)', () => {
    render(
      <ForecastChartTooltip
        active
        payload={makeTooltipPayload({
          naiveBaseline: null,
          confidence: null,
        })}
      />
    )
    // '—' is a text node inside a <p> that also holds a label — use substring match.
    // Both nulls must render '—', not '0'
    expect(screen.getByText(/Базовая оценка:.*—/)).toBeTruthy()
    expect(screen.getByText(/Уверенность:.*—/)).toBeTruthy()
  })

  it('renders nothing when active=false or payload is empty', () => {
    const { container: c1 } = render(<ForecastChartTooltip active={false} payload={[]} />)
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(<ForecastChartTooltip active payload={[]} />)
    expect(c2.firstChild).toBeNull()
  })
})
