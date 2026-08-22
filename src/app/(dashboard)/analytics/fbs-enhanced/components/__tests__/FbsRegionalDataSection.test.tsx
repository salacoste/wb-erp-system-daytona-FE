/**
 * Tests for FbsRegionalDataSection — Epic 129-FE Story 129.3
 *
 * Updated to match real backend contract per Request #202.
 * Fields renamed: regionName→region, orderShare→percentage.
 * Dropped: stockShare — single percentage field.
 *
 * Story 92.4-FE M-2 lesson: recharts components don't render in jsdom.
 * The vi.mock('recharts', ...) MUST be at the top of the file (before imports)
 * to intercept module resolution before any component code loads.
 *
 * Pattern 3 fixture wiring: emptyFbsRegionalDataItem() imported from fbs-enhanced-empty.ts.
 */

// recharts jsdom mock — MUST be before component imports (Story 92.4-FE M-2).
// Epic 169.6: Bar/XAxis/YAxis/CartesianGrid mocks capture their color props
// via data-attributes for exact token pins (no [class*=], no SVG className).
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: ({ fill }: { fill?: string }) => <div data-testid="recharts-bar" data-fill={fill} />,
    XAxis: ({ tick }: { tick?: { fill?: string } }) => (
      <div data-testid="recharts-x-axis" data-tick-fill={tick?.fill} />
    ),
    YAxis: ({ tick }: { tick?: { fill?: string } }) => (
      <div data-testid="recharts-y-axis" data-tick-fill={tick?.fill} />
    ),
    CartesianGrid: ({ stroke }: { stroke?: string }) => (
      <div data-testid="recharts-grid" data-stroke={stroke} />
    ),
    Tooltip: () => null,
  }
})

import React from 'react'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { formatPercentage } from '@/lib/utils'
import { emptyFbsRegionalDataItem } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsRegionalDataSection, RegionalTooltip } from '../FbsRegionalDataSection'

describe('FbsRegionalDataSection (Epic 129-FE)', () => {
  it('renders empty state when regionalData is empty array', () => {
    renderWithProviders(<FbsRegionalDataSection regionalData={[]} />)
    expect(screen.getByText(/Нет данных по регионам/)).toBeInTheDocument()
  })

  it('renders empty state when regionalData is null', () => {
    renderWithProviders(<FbsRegionalDataSection regionalData={null} />)
    expect(screen.getByText(/Нет данных по регионам/)).toBeInTheDocument()
  })

  it('renders bar chart when regions present — Pattern 3 fixture wiring', () => {
    const regions = [
      { ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 },
      { ...emptyFbsRegionalDataItem(), region: 'Сибирь', percentage: 20 },
    ]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    // Chart container rendered via mock
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    // Section landmark
    expect(screen.getByRole('region', { name: /Региональное распределение/ })).toBeInTheDocument()
  })

  it('renders no em-dashes when percentage is non-null (design intent lock)', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    // No em-dashes in the section when percentage is non-null
    expect(screen.queryAllByText('—').length).toBe(0)
  })
})

// Epic 169.6 token migration — exact var-name pins on the recharts color surface
describe('FbsRegionalDataSection token pins (Epic 169.6)', () => {
  it('Bar series fill uses the categorical chart-1 token (single source)', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    expect(screen.getByTestId('recharts-bar').getAttribute('data-fill')).toBe(
      'var(--color-chart-1)'
    )
  })

  it('XAxis tick text uses the chart-axis token', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    expect(screen.getByTestId('recharts-x-axis').getAttribute('data-tick-fill')).toBe(
      'var(--color-chart-axis)'
    )
  })

  it('YAxis tick text uses the chart-axis token', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    expect(screen.getByTestId('recharts-y-axis').getAttribute('data-tick-fill')).toBe(
      'var(--color-chart-axis)'
    )
  })

  it('CartesianGrid stroke uses the border token', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    expect(screen.getByTestId('recharts-grid').getAttribute('data-stroke')).toBe(
      'var(--color-border)'
    )
  })
})

// Epic 169.6 a11y data-alternative — sr-only summary gives non-hover access to tooltip data
describe('FbsRegionalDataSection sr-only data summary (Epic 169.6)', () => {
  it('exposes per-region percentages via sr-only text (formatted, ru-RU)', () => {
    const regions = [
      { ...emptyFbsRegionalDataItem(), region: 'Центральный', percentage: 45 },
      { ...emptyFbsRegionalDataItem(), region: 'Сибирь', percentage: 20 },
    ]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    const summary = screen.getByText(/^Данные по регионам:/)
    expect(summary.getAttribute('class')).toBe('sr-only')
    expect(summary.textContent).toContain(`Центральный — ${formatPercentage(45)}`)
    expect(summary.textContent).toContain(`Сибирь — ${formatPercentage(20)}`)
  })

  it('marks a null percentage as "нет данных" in the sr-only summary (not an em-dash)', () => {
    const regions = [{ ...emptyFbsRegionalDataItem(), region: 'Сибирь', percentage: null }]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    const summary = screen.getByText(/^Данные по регионам:/)
    expect(summary.textContent).toContain('Сибирь — нет данных')
  })
})

// Epic 169.6 no-hex guard — owned component sources must not carry raw hex color
// literals (dark-mode regression guard; comments are exempt).
// Hex width 3-8: catches 3-digit shorthand (#000) and 8-digit with alpha (#RRGGBBAA).
describe('FbsEnhanced source no-hex guard (Epic 169.6)', () => {
  it('owned component sources contain no raw hex color literals outside comments', () => {
    const componentsDir = join(dirname(fileURLToPath(import.meta.url)), '..')
    const routeDir = dirname(componentsDir)
    // Scan components dir + top-level .tsx files in the route dir (page.tsx)
    const scanDirs = [componentsDir, routeDir]
    for (const dir of scanDirs) {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.tsx')) continue
        // route dir: top-level files only (components/ subdir covered by its own loop)
        if (dir === routeDir && file !== 'page.tsx') continue
        const source = readFileSync(join(dir, file), 'utf-8')
        const codeOnly = source
          .split('\n')
          .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
          .join('\n')
        expect(codeOnly, `${file} must not contain raw hex colors`).not.toMatch(
          /#[0-9A-Fa-f]{3,8}\b/
        )
      }
    }
  })
})

// RegionalTooltip direct unit tests (exported for testing only)
describe('RegionalTooltip (Epic 129-FE)', () => {
  it('renders region name + single metric row when payload is populated', () => {
    const payload = [{ name: 'Доля (%)', value: 45, color: '#E53935' }]
    renderWithProviders(<RegionalTooltip active={true} payload={payload} label="Центральный" />)
    expect(screen.getByText('Центральный')).toBeInTheDocument()
    expect(screen.getByText(/Доля/)).toBeInTheDocument()
  })

  it('renders em-dash when payload value is null (anti-pattern #8 + Defensive Frontend)', () => {
    const payload = [{ name: 'Доля (%)', value: null as unknown as number, color: '#E53935' }]
    renderWithProviders(<RegionalTooltip active={true} payload={payload} label="Урал" />)
    // null value → '—' per CLAUDE.md anti-pattern #8
    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  it('returns null when active is false or payload is empty (recharts contract)', () => {
    const { container: c1 } = renderWithProviders(
      <RegionalTooltip
        active={false}
        payload={[{ name: 'X', value: 10, color: '#000' }]}
        label="Регион"
      />
    )
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = renderWithProviders(
      <RegionalTooltip active={true} payload={[]} label="Регион" />
    )
    expect(c2.firstChild).toBeNull()
  })
})
