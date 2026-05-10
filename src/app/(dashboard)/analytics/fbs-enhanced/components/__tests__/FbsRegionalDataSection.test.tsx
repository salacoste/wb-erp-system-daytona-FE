/**
 * Tests for FbsRegionalDataSection — Story 96.13-FE
 *
 * Story 92.4-FE M-2 lesson: recharts components don't render in jsdom.
 * The vi.mock('recharts', ...) MUST be at the top of the file (before imports)
 * to intercept module resolution before any component code loads.
 *
 * Pattern 3 fixture wiring: emptyFbsRegionalDataItem() imported from fbs-enhanced-empty.ts.
 */

// recharts jsdom mock — MUST be before component imports (Story 92.4-FE M-2)
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
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsRegionalDataItem } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsRegionalDataSection, RegionalTooltip } from '../FbsRegionalDataSection'

describe('FbsRegionalDataSection (Story 96.13-FE)', () => {
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
      { ...emptyFbsRegionalDataItem(), regionName: 'Центральный', orderShare: 45, stockShare: 40 },
      { ...emptyFbsRegionalDataItem(), regionName: 'Сибирь', orderShare: 20, stockShare: 25 },
    ]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    // Chart container rendered via mock
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    // Section landmark
    expect(screen.getByRole('region', { name: /Региональное распределение/ })).toBeInTheDocument()
  })

  it('M2-3: section renders 0 em-dashes when both shares are non-null (design intent lock)', () => {
    // Chart section: bar chart with populated shares — no '—' in the section itself
    // (recharts Tooltip is mocked out; no tooltip dashes rendered in jsdom)
    const regions = [
      { ...emptyFbsRegionalDataItem(), regionName: 'Центральный', orderShare: 45, stockShare: 40 },
    ]
    renderWithProviders(<FbsRegionalDataSection regionalData={regions} />)
    // M2-3: no em-dashes in the section when shares are non-null — locks design intent
    expect(screen.queryAllByText('—').length).toBe(0)
  })
})

// M-3 fix: RegionalTooltip direct unit tests (exported for testing only)
// Tooltip was previously swallowed by Bar: () => null mock — zero coverage.
describe('RegionalTooltip (Story 96.13-FE M-3)', () => {
  it('renders region name + 2 metric rows when payload is populated', () => {
    const payload = [
      { name: 'Доля заказов (%)', value: 45, color: '#E53935' },
      { name: 'Доля остатков (%)', value: 40, color: '#3B82F6' },
    ]
    renderWithProviders(<RegionalTooltip active={true} payload={payload} label="Центральный" />)
    expect(screen.getByText('Центральный')).toBeInTheDocument()
    expect(screen.getByText(/Доля заказов/)).toBeInTheDocument()
    expect(screen.getByText(/Доля остатков/)).toBeInTheDocument()
  })

  it('renders em-dash when payload value is null (anti-pattern #8 + Defensive Frontend)', () => {
    const payload = [
      { name: 'Доля заказов (%)', value: null as unknown as number, color: '#E53935' },
    ]
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
