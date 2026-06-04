/**
 * TopSkusTable tests — pure View component tests
 * Story 108.4-FE: Top SKUs during collecting state.
 *
 * Tests the exported TopSkusTableView directly (pure functions over hook mocking pattern).
 * Container tests use module-level mock with mockReturnValue for per-test control.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TopSkusTableView, TopSkusTable } from '../TopSkusTable'
import type { TopSkuEntry } from '@/types/ai/trends-sneak'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cabinet-1' }),
}))

// Module-level mock so vi.mocked works for per-test overrides
vi.mock('@/hooks/useAiTrends', () => ({
  useAiTrends: vi.fn(),
}))

import * as aiTrendsHook from '@/hooks/useAiTrends'
const mockUseAiTrends = vi.mocked(aiTrendsHook.useAiTrends)

const mockSkus: TopSkuEntry[] = [
  { nmId: 101, vendorCode: 'SKU-A', avgPerDay: 5.3, weeklyVolume: 37 },
  { nmId: 202, vendorCode: null, avgPerDay: null, weeklyVolume: null },
]

// ── Pure view tests (no hook needed) ─────────────────────────────────────────

describe('TopSkusTableView', () => {
  it('renders "Пока нет данных по SKU" when data is empty', () => {
    render(<TopSkusTableView data={[]} />)
    expect(screen.getByText('Пока нет данных по SKU')).toBeInTheDocument()
  })

  it('renders SKU rows with nmId and vendorCode', () => {
    render(<TopSkusTableView data={mockSkus} />)
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('SKU-A')).toBeInTheDocument()
    expect(screen.getByText('202')).toBeInTheDocument()
  })

  it('renders avgPerDay with one decimal place', () => {
    render(<TopSkusTableView data={mockSkus} />)
    expect(screen.getByText('5,3')).toBeInTheDocument() // ru-RU comma (formatDecimal)
  })

  it('renders weeklyVolume count', () => {
    render(<TopSkusTableView data={mockSkus} />)
    expect(screen.getByText('37')).toBeInTheDocument()
  })

  it('renders em-dash for null fields', () => {
    render(<TopSkusTableView data={mockSkus} />)
    // Second SKU: null vendorCode, null avgPerDay, null weeklyVolume -> multiple —
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})

// ── Container: loading / error states ────────────────────────────────────────

describe('TopSkusTable (container)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function wrap() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={qc}>
        <TopSkusTable />
      </QueryClientProvider>
    )
  }

  it('renders error alert when hook returns error', () => {
    mockUseAiTrends.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof aiTrendsHook.useAiTrends>)
    wrap()
    expect(screen.getByText('Не удалось загрузить топ SKU')).toBeInTheDocument()
  })

  it('renders empty state when data has no SKUs', () => {
    mockUseAiTrends.mockReturnValue({
      data: { topSkus: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof aiTrendsHook.useAiTrends>)
    wrap()
    expect(screen.getByText('Пока нет данных по SKU')).toBeInTheDocument()
  })

  it('renders SKU rows when data is loaded', () => {
    mockUseAiTrends.mockReturnValue({
      data: { topSkus: mockSkus },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof aiTrendsHook.useAiTrends>)
    wrap()
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('SKU-A')).toBeInTheDocument()
  })
})
